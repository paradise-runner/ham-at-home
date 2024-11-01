package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type item struct {
	title    string
	images   []string
	filepath string
	archived bool
}

func (i item) Title() string {
	if i.archived {
		return "🗄️  " + i.title + " (archived)"
	}
	return "📄 " + i.title
}
func (i item) Description() string { return fmt.Sprintf("📸 %d images", len(i.images)) }
func (i item) FilterValue() string { return i.title }

type model struct {
	list          list.Model
	items         []item
	err           error
	spinner       spinner.Model
	loading       bool
	rootDir       string
	showImages    bool
	showArchived  bool
	width         int
	height        int
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		m.spinner.Tick,
		findMarkdownFiles(m.rootDir),
	)
}

func initialModel(rootDir string) model {
	s := spinner.New()
	s.Spinner = spinner.Dot

	styles := list.DefaultStyles()
	styles.Title = styles.Title.
		Foreground(lipgloss.AdaptiveColor{Light: "#1a1a1a", Dark: "#ffffff"}).
		MarginLeft(2)

	delegate := list.NewDefaultDelegate()
	delegate.Styles.SelectedTitle = delegate.Styles.SelectedTitle.Foreground(lipgloss.Color("170"))
	delegate.Styles.SelectedDesc = delegate.Styles.SelectedDesc.Foreground(lipgloss.Color("241"))


	l := list.New([]list.Item{}, delegate, 0, 0)
	l.Title = "📝 Markdown Files"
	l.SetShowStatusBar(false)
	l.SetFilteringEnabled(false)
	l.Styles = styles

	return model{
		list:         l,
		spinner:      s,
		loading:      true,
		rootDir:      rootDir,
		showImages:   false,
		showArchived: false,
	}
}

type foundFiles []item

func findMarkdownFiles(root string) tea.Cmd {
	return func() tea.Msg {
		info, err := os.Stat(root)
		if err != nil {
			if os.IsNotExist(err) {
				return fmt.Errorf("❌ directory does not exist: %s", root)
			}
			return err
		}
		if !info.IsDir() {
			return fmt.Errorf("❌ path is not a directory: %s", root)
		}

		files := make([]item, 0)
		seenFiles := make(map[string]bool)
		dirs := []string{root}
		archiveDir := filepath.Join(root, "archived")
		if _, err := os.Stat(archiveDir); err == nil {
			dirs = append(dirs, archiveDir)
		}

		for _, dir := range dirs {
			err = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}
				if !info.IsDir() && strings.HasSuffix(strings.ToLower(path), ".md") {
					isArchived := strings.Contains(path, filepath.Join(root, "archived"))
				content, err := os.ReadFile(path)
				if err != nil {
					return err
				}

				images := findImages(string(content))
					if !seenFiles[filepath.Base(path)] {
						seenFiles[filepath.Base(path)] = true
						files = append(files, item{
							title:    filepath.Base(path),
							images:   images,
							filepath: path,
							archived: isArchived,
						})
					}
				}
				return nil
			})
			if err != nil {
				return err
			}
		}

		if err != nil {
			return err
		}

		if len(files) == 0 {
			return fmt.Errorf("❌ no markdown files found in directory: %s", root)
		}

		return foundFiles(files)
	}
}

func findImages(content string) []string {
	re := regexp.MustCompile(`!\[.*?\]\((.*?\.jpg)\)`)
	matches := re.FindAllStringSubmatch(content, -1)
	
	var images []string
	for _, match := range matches {
		if len(match) > 1 {
			images = append(images, match[1])
		}
	}

	// also search for the cover image found after 'coverImage: ' in the front matter
	re = regexp.MustCompile(`coverImage: (.*?\.jpg)`)
	cover_match := re.FindStringSubmatch(content)
	if len(cover_match) > 1 {
		// strip out any leading or trailing whitespace and any leading or trailing quotes
		cover_match[1] = strings.TrimSpace(cover_match[1])
		cover_match[1] = strings.Trim(cover_match[1], "\"")
		cover_match[1] = strings.Trim(cover_match[1], "'")
		images = append(images, cover_match[1])
	}


	return images
}


func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.list.SetWidth(msg.Width)
		m.list.SetHeight(msg.Height - 2)
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "q":
			if !m.showImages {
				return m, tea.Quit
			}
		case "v":
			if !m.loading {
				m.showArchived = !m.showArchived
				var filteredItems []list.Item
				for _, item := range m.items {
					if item.archived == m.showArchived {
						filteredItems = append(filteredItems, item)
					}
				}
				m.list.SetItems(filteredItems)
			}
		case "enter":
			if !m.loading {
				m.showImages = true
			}
		case "u":
			if !m.loading && m.showArchived {
				if i, ok := m.list.SelectedItem().(item); ok {
					// Get the original content directory by removing "archived" from the path
					originalDir := filepath.Dir(strings.Replace(i.filepath, filepath.Join(m.rootDir, "archived"), m.rootDir, 1))
					
					// Create the original directory if it doesn't exist
					if err := os.MkdirAll(originalDir, 0755); err != nil {
						m.err = fmt.Errorf("failed to create original directory: %v", err)
						return m, tea.Quit
					}

					// Move the markdown file back
					newPath := filepath.Join(originalDir, filepath.Base(i.filepath))
					if err := moveFile(i.filepath, newPath); err != nil {
						m.err = fmt.Errorf("failed to move file: %v", err)
						return m, tea.Quit
					}

					// Move associated images back
					for _, img := range i.images {
						imgPath := filepath.Join(filepath.Dir(i.filepath), "images", filepath.Base(img))
						
						// Find the original public/images directory
						rootDirComponents := strings.Split(m.rootDir, "/")
						imgComponents := strings.Split(img, "/")
						var commonPrefix []string
						for i := 0; i < len(rootDirComponents) && i < len(imgComponents); i++ {
							if rootDirComponents[i] == imgComponents[i] {
								commonPrefix = append(commonPrefix, rootDirComponents[i])
							} else {
								break
							}
						}
						imagesDir := filepath.Join(strings.Join(commonPrefix, "/"), "public")
						newImgPath := filepath.Join(imagesDir, img)
						
						// Create the destination directory if it doesn't exist
						if err := os.MkdirAll(filepath.Dir(newImgPath), 0755); err != nil {
							fmt.Printf("Warning: failed to create images directory: %v\n", err)
							continue
						}
						
						if err := moveFile(imgPath, newImgPath); err != nil {
							fmt.Printf("Warning: failed to move image %s: %v\n", img, err)
						}
					}

					// Refresh the file list
					return m, findMarkdownFiles(m.rootDir)
				}
			}
		case "a":
			if !m.loading {
				if i, ok := m.list.SelectedItem().(item); ok {
					archiveDir := filepath.Join(m.rootDir, "archived")
					if err := os.MkdirAll(archiveDir, 0755); err != nil {
						m.err = fmt.Errorf("failed to create archive directory: %v", err)
						return m, tea.Quit
					}

					// Move the markdown file
					newPath := filepath.Join(archiveDir, filepath.Base(i.filepath))
					if err := moveFile(i.filepath, newPath); err != nil {
						m.err = fmt.Errorf("failed to move file: %v", err)
						return m, tea.Quit
					}

					// Move associated images from public/images
					for _, img := range i.images {

						//find the directory name that is n layers up form the m root dir
						//this is the directory that the images are stored in
						//e.g. if the root dir is /home/user/website/content/blog/2021/01/01
						//the images are stored in /home/user/website/public/images/blog/2021/01/01

						//split the root dir into its components
						rootDirComponents := strings.Split(m.rootDir, "/")
						

						//split the image path into its components
						imgComponents := strings.Split(img, "/")
						//find the common prefix between the two
						var commonPrefix []string
						for i := 0; i < len(rootDirComponents) && i < len(imgComponents); i++ {
							if rootDirComponents[i] == imgComponents[i] {
								commonPrefix = append(commonPrefix, rootDirComponents[i])
							} else {
								break
							}
						}

						//find the directory that the images are stored in
						imagesDir := strings.Join(commonPrefix, "/")
						imagesDir = filepath.Join(imagesDir, "public")

						imgPath := filepath.Join(imagesDir, img)
						newImgPath := filepath.Join(archiveDir, "images", filepath.Base(img))
						
						// Create images subdirectory in archive if it doesn't exist
						if err := os.MkdirAll(filepath.Join(archiveDir, "images"), 0755); err != nil {
							fmt.Printf("Warning: failed to create archive images directory: %v\n", err)
							continue
						}
						
						if err := moveFile(imgPath, newImgPath); err != nil {
							// Just log the error but continue
							fmt.Printf("Warning: failed to move image %s: %v\n", img, err)
						}
					}

					// Refresh the file list
					return m, findMarkdownFiles(m.rootDir)
				}
			}
		case "esc":
			if m.showImages {
				m.showImages = false
			}
			return m, nil
		}
	

	case foundFiles:
		m.loading = false
		m.items = msg
		var filteredItems []list.Item
		for _, file := range msg {
			if !file.archived {
				filteredItems = append(filteredItems, file)
			}
		}
		m.list.SetItems(filteredItems)
		return m, nil

	case error:
		m.err = msg
		m.loading = false
		return m, tea.Quit
	}

	var cmd tea.Cmd
	if m.loading {
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}

	m.list, cmd = m.list.Update(msg)
	return m, cmd
}

func (m model) View() string {
	if m.err != nil {
		return lipgloss.NewStyle().
			Foreground(lipgloss.Color("9")).
			Render(fmt.Sprintf("\n%v\n", m.err))
	}

	if m.loading {
		return fmt.Sprintf("🔍 Scanning files... %s", m.spinner.View())
	}

	if m.showImages {
		if i, ok := m.list.SelectedItem().(item); ok {
			var sb strings.Builder
			sb.WriteString(fmt.Sprintf("📸 Images in %s:\n\n", i.title))
			for _, img := range i.images {
				sb.WriteString(fmt.Sprintf("  • %s\n", img))
			}
			sb.WriteString("\n↩️  Press ESC to go back")
			return sb.String()
		}
	}

	viewMode := "Current"
	if m.showArchived {
		viewMode = "Archived"
	}
	controls := "↵ Press ENTER to view images • "
	if m.showArchived {
		controls += "u to unarchive • "
	} else {
		controls += "a to archive • "
	}
	controls += fmt.Sprintf("v to toggle %s view • q to quit", viewMode)
	return fmt.Sprintf("%s\n%s", m.list.View(), controls)
}

func moveFile(src, dst string) error {
	// First try to rename (move) the file
	if err := os.Rename(src, dst); err == nil {
		return nil
	}
	
	// If rename fails (e.g., across devices), fallback to copy and delete
	source, err := os.Open(src)
	if err != nil {
		return err
	}
	defer source.Close()

	destination, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destination.Close()

	if _, err := io.Copy(destination, source); err != nil {
		return err
	}

	return os.Remove(src)
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("❌ Please provide a directory path")
		os.Exit(1)
	}

	p := tea.NewProgram(initialModel(os.Args[1]))
	if _, err := p.Run(); err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		os.Exit(1)
	}
}
