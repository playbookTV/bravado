import { useState } from 'react'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

interface ExportOptionsProps {
  content: string
  title: string
}

export default function ExportOptions({ content, title }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'markdown' | 'txt' | 'docx') => {
    setIsExporting(true)
    try {
      // Create a temporary div to parse HTML content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content

      switch (format) {
        case 'markdown':
          const markdown = convertToMarkdown(tempDiv)
          downloadFile(markdown, `${title}.md`, 'text/markdown')
          break
        case 'txt':
          const text = convertToPlainText(tempDiv)
          downloadFile(text, `${title}.txt`, 'text/plain')
          break
        case 'docx':
          await exportToDocx(tempDiv, title)
          break
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-2">
        <button
          onClick={() => handleExport('markdown')}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Export as Markdown
        </button>
        <button
          onClick={() => handleExport('txt')}
          disabled={isExporting}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Export as Text
        </button>
        <button
          onClick={() => handleExport('docx')}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
        >
          Export as DOCX
        </button>
      </div>
    </div>
  )
}

function convertToMarkdown(element: HTMLElement): string {
  let markdown = ''

  // Process each child node
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      markdown += node.textContent || ''
      continue
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      const content = el.textContent?.trim() || ''

      switch (tag) {
        case 'article':
          markdown += convertToMarkdown(el)
          break
        case 'h1':
          markdown += `# ${content}\n\n`
          break
        case 'h2':
          markdown += `## ${content}\n\n`
          break
        case 'h3':
          markdown += `### ${content}\n\n`
          break
        case 'p':
          markdown += `${content}\n\n`
          break
        case 'strong':
          markdown += `**${content}**`
          break
        case 'em':
          markdown += `*${content}*`
          break
        case 'blockquote':
          markdown += `> ${content}\n\n`
          break
        case 'ul':
          for (const li of Array.from(el.children)) {
            markdown += `- ${li.textContent?.trim()}\n`
          }
          markdown += '\n'
          break
        case 'ol':
          let counter = 1
          for (const li of Array.from(el.children)) {
            markdown += `${counter++}. ${li.textContent?.trim()}\n`
          }
          markdown += '\n'
          break
        case 'cite':
          markdown += `_${content}_`
          break
        case 'br':
          markdown += '\n'
          break
        default:
          markdown += convertToMarkdown(el)
      }
    }
  }

  return markdown.trim()
}

function convertToPlainText(element: HTMLElement): string {
  let text = ''

  // Process each child node
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || ''
      continue
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      const content = el.textContent?.trim() || ''

      switch (tag) {
        case 'article':
          text += convertToPlainText(el)
          break
        case 'h1':
        case 'h2':
        case 'h3':
          text += `${content}\n\n`
          break
        case 'p':
          text += `${content}\n\n`
          break
        case 'blockquote':
          text += `"${content}"\n\n`
          break
        case 'ul':
        case 'ol':
          for (const li of Array.from(el.children)) {
            text += `• ${li.textContent?.trim()}\n`
          }
          text += '\n'
          break
        case 'br':
          text += '\n'
          break
        default:
          text += convertToPlainText(el)
      }
    }
  }

  return text.trim()
}

async function exportToDocx(element: HTMLElement, title: string) {
  const paragraphs: Paragraph[] = []

  // Process each child node
  function processElement(el: HTMLElement): Paragraph[] {
    const result: Paragraph[] = []
    const tag = el.tagName.toLowerCase()
    const content = el.textContent?.trim() || ''

    switch (tag) {
      case 'article':
        for (const child of Array.from(el.children)) {
          result.push(...processElement(child as HTMLElement))
        }
        break
      case 'h1':
        result.push(new Paragraph({
          text: content,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 }
        }))
        break
      case 'h2':
        result.push(new Paragraph({
          text: content,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 }
        }))
        break
      case 'h3':
        result.push(new Paragraph({
          text: content,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 }
        }))
        break
      case 'p':
        result.push(new Paragraph({
          children: [new TextRun(content)],
          spacing: { after: 120 }
        }))
        break
      case 'blockquote':
        result.push(new Paragraph({
          children: [new TextRun({ text: content, italics: true })],
          indent: { left: 720 },
          spacing: { before: 120, after: 120 }
        }))
        break
      case 'ul':
      case 'ol':
        for (const li of Array.from(el.children)) {
          result.push(new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true }),
              new TextRun(li.textContent?.trim() || '')
            ],
            indent: { left: 720 },
            spacing: { after: 120 }
          }))
        }
        break
      default:
        for (const child of Array.from(el.children)) {
          result.push(...processElement(child as HTMLElement))
        }
    }

    return result
  }

  // Add title
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 32 })],
      spacing: { after: 240 }
    })
  )

  // Process content
  paragraphs.push(...processElement(element))

  // Create document
  const document = new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  })

  // Generate and save file
  const buffer = await Packer.toBuffer(document)
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  saveAs(blob, `${title}.docx`)
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  saveAs(blob, filename)
} 