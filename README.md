# 🐷@🏠

The Ham at Home project combines a Next.js blog frontend with AI-powered content generation tools to empower the home developer to be able to generate an entire world of content from a small MacBook Air. 

The project can run on a small local laptop with either enough swap storage or 64GB of memory. Blog posts from local take around ~20 minutes to generate. An M1 MacBook air should take around ~6 minutes per image, so anywhere from 14-30 minutes per post. It consists of three main components:

## 1. Blog Website (src/)
A modern Next.js website implementing a blog platform with:
- Responsive design using Tailwind CSS
- Category and tag filtering
- Featured post highlighting
- Dark/light theme support
- SEO optimization

## 2. Posts CLI (main.go)
A command-line tool written in Go for managing blog posts:
- List all markdown posts
- View post metadata and images
- Archive/unarchive posts
- Interactive TUI using [Bubble Tea](https://github.com/charmbracelet/bubbletea)

Usage:
```bash
go run main.go <content-directory>
```

## 3. AI Post Generator (main.py)
A Python script that generates blog posts using:
- LLM integration (Gemini/Ollama) for content generation
- Stable Diffusion for image generation
- Automatic metadata and frontmatter creation
- Category-based post generation
- Image alt text generation

Usage:
```bash
# Generate posts using local Ollama
python main.py

# Generate posts using remote Gemini API
python main.py remote
```

## Setup

1. Install dependencies:
```bash
# Frontend
npm install

# Go CLI
go mod tidy

# Python generator
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
HF_ACCESS_TOKEN=your_huggingface_token
GEMINI_API_KEY=your_gemini_api_key
```

3. Start the development server:
```bash
npm run dev
```

## Directory Structure

```
├── src/                  # Next.js blog frontend
│   └── markdown/posts    # Markdown files
├── public/             # Static assets
│   └── images/        # Generated images
├── main.go             # Posts management CLI
└── main.py             # AI content generator
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GPL License - see the LICENSE file for details.
