package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func processFile(filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		re := regexp.MustCompile("`([^`]+)`")
		modifiedLine := re.ReplaceAllStringFunc(line, func(match string) string {
			code := match[1 : len(match)-1]
			if strings.HasPrefix(code, "/") && strings.HasSuffix(code, "/") {
				// if code is wrapped with '/', replace accordingly
				return fmt.Sprintf(`<span class="pho alt">%s</span>`, code[1:len(code)-1])
			}
			// default
			return fmt.Sprintf(`<span class="pho">%s</span>`, code)
		})
		lines = append(lines, modifiedLine)
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	return os.WriteFile(filePath, []byte(strings.Join(lines, "\n")), 0644)
}

func processDirectory(rootPath string) error {
	return filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && filepath.Ext(path) == ".md" {
			if err := processFile(path); err != nil {
				fmt.Printf("Error processing file %s: %s\n", path, err)
			} else {
				fmt.Printf("Processed file: %s\n", path)
			}
		}
		return nil
	})
}

func main() {
	directoryPath := "data/"
	if err := processDirectory(directoryPath); err != nil {
		fmt.Printf("Error processing directory: %s\n", err)
	}
}
