import requests
from datetime import datetime
import os
import re
from typing import Tuple
import unidecode
import time
import io
import sys
from PIL import Image
import google.generativeai as genai

PRIMARY_IMAGE_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large-turbo"
SECONDARY_IMAGE_API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
HF_ACCESS_TOKEN = os.getenv("HF_ACCESS_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def generate_blog_post_images(images, blog_post_title, local_only=True):
    if local_only:
        print(f"Generating images for blog post: {blog_post_title} 🚀")

        # set some environment variables
        os.environ["PYTORCH_MPS_HIGH_WATERMARK_RATIO"] = "0.0"
        os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

        import torch
        from diffusers import StableDiffusion3Pipeline

        access_token = HF_ACCESS_TOKEN

        pipe = StableDiffusion3Pipeline.from_pretrained(
            "stabilityai/stable-diffusion-3.5-large-turbo",
            torch_dtype=torch.bfloat16,
            token=access_token,
        )
        pipe = pipe.to("mps")

        pipe.enable_attention_slicing()

        for image_path, alt_text in images:
            prompt = f"""
            Generate an image that is named {image_path} and represents "{alt_text}".
            """
            s = time.time()
            image = pipe(
                prompt,
                num_inference_steps=4,
                guidance_scale=0.0,
            ).images[0]
            print(
                f"Time taken: {int((time.time() - s) / 60)}m {int((time.time() - s) % 60)}s"
            )
            image.save(f"public{image_path}")
    else:
        headers = {"Authorization": f"Bearer {HF_ACCESS_TOKEN}"}
        for image_path, alt_text in images:
            prompt = f"""
            Generate an image that is named {image_path} and represents "{alt_text}".
            """
            retries = 7
            print(f"Generating image for {image_path}...")
            for i in range(retries):
                if i > 0:
                    time.sleep(61)
                try:
                    response = requests.post(PRIMARY_IMAGE_API_URL, headers=headers, json=prompt)
                    response.raise_for_status()
                    image = Image.open(io.BytesIO(response.content))
                    image.save(f"public{image_path}")
                    break
                except requests.exceptions.RequestException as e:
                    if response.status_code == 429:
                        wait_time = 3 ** i
                        print(f"Rate limited. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        print(f"Error generating image: {e}")
                        break

# Define the regex pattern
gray_matter_pattern = re.compile(
    r"""
    .*?                                        # Any text before (non-greedy)
    ^---\s*                                    # Opening dashes with optional whitespace
    (?P<content>                               # Named capture group for all content
        (?:(?!---)                             # Negative lookahead for closing dashes
            (?:
                title:\s*"[^"]*".*?            # Title field
                date:\s*"[\d-]+".*?            # Date field
                description:\s*"[^"]*".*?       # Description field
                coverImage:\s*"[^"]*".*?       # Cover image field
                tags:\s*\[[^\]]*\].*?          # Tags array
                category:\s*"[^"]*".*?         # Category field
            )
        )+
    )
    ---                                        # Closing dashes
    .*                                         # Any text after
    """,
    re.VERBOSE | re.DOTALL | re.MULTILINE,
)


def prompt_llm(prompt: str, model: str = "llama3.2:latest") -> str:
    """Generate text using the Ollama API"""

    # API endpoint
    url = "http://localhost:11434/api/generate"

    # Request headers
    headers = {"Content-Type": "application/json"}

    # Request data
    data = {"model": model, "prompt": prompt, "stream": False}

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()

        # Extract the generated content
        content = response.json().get("response", "")

        return content

    except requests.exceptions.RequestException as e:
        print(f"Error generating text: {e}")
        return None


def request_from_llm(prompt: str, model: str = "gemini-1.5-flash") -> str:
    api_key = GEMINI_API_KEY
    # url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model)
    response = model.generate_content(prompt)
    return response.text


# Function to extract specific fields
def parse_gray_matter(text):
    if match := gray_matter_pattern.match(text):
        content = match.group("content")

        # Extract individual fields
        title = re.search(r'title:\s*"([^"]*)"', content).group(1)
        date = re.search(r'date:\s*"([^"]*)"', content).group(1)
        description = re.search(r'description:\s*"([^"]*)"', content).group(1)
        cover_image = re.search(r'coverImage:\s*"([^"]*)"', content).group(1)
        tags = re.search(r"tags:\s*\[(.*?)\]", content).group(1)
        category = re.search(r'category:\s*"([^"]*)"', content).group(1)

        return {
            "title": title,
            "date": date,
            "description": description,
            "coverImage": cover_image,
            "tags": [tag.strip().strip('"') for tag in tags.split(",")],
            "category": category,
        }
    return None


def generate_blog_post(category, local_only) -> Tuple[str, str, str]:
    """Generate a blog post and title for a given category"""

    gray_matter_prompt = f"""
    generate a gray matter header for a creative blog post in the category: {category} following this format exactly (including the triple dashes):
    
    ---
    title: "Getting Started with Next.js"
    date: "2024-03-28"
    description: "Learn the basics of Next.js and start building modern web applications."
    coverImage: "/images/blog/nextjs-cover.jpg"
    tags: ["next.js", "react", "web development"]
    category: "development" 
    ---

    Make the gray matter specific to a blog post, and not generic or a template. 
    """
    print("Generating gray matter header...")
    # Generate the gray matter header
    if local_only:
        gray_matter = prompt_llm(gray_matter_prompt)
    else:
        gray_matter = request_from_llm(gray_matter_prompt)

    print(gray_matter)

    # Extract the individual fields
    gray_matter_data = parse_gray_matter(gray_matter)

    if not gray_matter_data:
        raise ValueError("Error parsing gray matter header")

    # confirm that the result isn't too similar to the prompt by looking for key words
    if (
        "getting started" in gray_matter_data["title"].lower()
        and "next.js" in gray_matter_data["title"].lower()
    ):
        raise ValueError("Title is too similar to the prompt, retrying...")

    # reconstruct the gray matter header
    gray_matter = f"""---
title: "{gray_matter_data['title']}"
date: "{datetime.now().strftime('%Y-%m-%d')}"
description: "{gray_matter_data['description']}"
coverImage: "{gray_matter_data['coverImage']}"
tags: {gray_matter_data['tags']}
category: "{category}"
---
    """

    # get the list of current posts, extract the titles, and check if this title is similar to any of them
    current_posts = os.listdir("content/posts")
    # filter out any non-markdown files
    current_posts = [post for post in current_posts if post.endswith(".md")]
    current_titles = [re.search(r"title: \"(.*?)\"", open(f"content/posts/{post}").read()).group(1) for post in current_posts]

    similar_posts_prompt = f"""
    Is the new blog post title too similar to any of the existing posts?
    Proposed Title: {gray_matter_data['title']}

    Current Titles:
    {current_titles}

    If yes, please provide a new title in format "title: 'New Title', if not, enter 'no'.
    """

    print("Checking for similar titles...")
    # check for similar titles
    if local_only:
        new_title = prompt_llm(similar_posts_prompt)
    else:
        new_title = request_from_llm(similar_posts_prompt)


    # strip out all quotes
    new_title = new_title.replace("'", "").replace('"', "")

    # remove the word "title" from the response
    new_title = re.sub(r"title: ", "", new_title)

    # strip all non-alphanumeric characters
    new_title = re.sub(r"[^a-zA-Z0-9\s]", "", new_title)

    # strip whitespace and newlines
    new_title = new_title.strip()

    print(f"New title: '{new_title}'")
    print(new_title.lower() in ("no"))
    
    if new_title.lower() not in ("no"):
        # extract the new title
        new_title = re.search(r"title: '([^']*)'", new_title).group(1)
        # check that we we're able to extract a new title
        if not new_title:
            raise ValueError("Error extracting new title")
        # update the gray matter header with the new title
        gray_matter = re.sub(r"title: \"(.*?)\"", f"title: \"{new_title}\"", gray_matter)

        new_title = request_from_llm(similar_posts_prompt)


    # generate a blog post using the gray matter header
    blog_post_prompt = f"""
    Write a blog post in markdown using the following gray matter header:
    {gray_matter}
    The post should be informative, engaging, thought-provoking, and well-structured. There should be a clear introduction, body, and conclusion. Posts should be around 1000 words and include relevant images and links.
    Include markdown image files located at /images/blog; e.g. ![alt text](/images/blog/image.jpg).
    Image names should be abstract representations of the surrounding text; e.g. "Getting Started with Next.js" -> "new-world-gatway.jpg", "swirling-vortex.jpg", "lightbulb-on.jpg", "starting-line.jpg", etc.
    Don't include the gray matter header in the post.
    """

    print("Generating blog post content...")
    # Generate the blog post content
    if local_only:
        content = prompt_llm(blog_post_prompt)
    else:
        content = request_from_llm(blog_post_prompt, "gemini-1.5-pro")

    # add the gray matter header to the content
    content = f"{gray_matter}\n{content}"

    return content, gray_matter_data["title"], gray_matter_data["description"]


def save_blog_post(content, filename):
    """Save the blog post to a file"""
    if content:
        try:
            with open(filename, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Successfully saved blog post to {filename}")
        except IOError as e:
            print(f"Error saving blog post: {e}")


def slugify(text):
    text = unidecode.unidecode(text).lower()
    return re.sub(r"[\W_]+", "-", text)


def main(local_only=True):
    # Categories for blog posts
    categories = [
        'Development',
        "Travel",
        "Lifestyle",
        "Technology",
        "Food",
        "Health",
    ]

    # Generate a blog post for each category
    for category in categories:
        print(f"\nGenerating blog post for category: {category}")

        title = ""

        # We're asking an LLM to follow a format, but sometimes it messes up on title generation, so we'll keep trying until we get a title
        while not title:
            try:
                # Generate the blog post
                content, title, _ = generate_blog_post(category, local_only)
            except Exception as e:
                print(f"Error generating blog post: {e}, retrying...")
                continue

        slug = slugify(title)

        # save the content to a file
        filename = f"content/posts/{slug}.md"

        if content:
            # Save the blog post
            save_blog_post(content, filename)

        # get the cover image from the gray matter header
        cover_image = re.search(r'coverImage:\s*"([^"]*)"', content).group(1)

        # find all images in in the markdown format ![alt text](/images/blog/image.jpg)
        images = re.findall(r"\!\[.*?\]\((.*?)\)", content)

        # find the associated alt text
        alt_text = re.findall(r"\!\[(.*?)\]", content)

        # combine the image paths and alt text
        images = list(zip(images, alt_text))

        images += [(cover_image, f"Cover image for a blog post about {title}")]
        print(f"Found {len(images)} images in the blog post")
        generate_blog_post_images(images, title, local_only)

        # print(f"Completed generating post for {category}, waiting for 30 seconds for rate limiting...")
        # time.sleep(30)


if __name__ == "__main__":
    local_only = True
    # add arguments to run as local_only
    args = sys.argv[1:]
    if args and args[0] == "remote":
        local_only = False

    main(local_only)

