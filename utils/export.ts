import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export const exportToMarkdown = (content: string, filename = 'content.md') => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, filename)
}

export const exportToTxt = (content: string, filename = 'content.txt') => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, filename)
}

export const exportToDocx = async (content: string, filename = 'content.docx') => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: content.split('\n').map(paragraph => 
        new Paragraph({
          children: [new TextRun(paragraph)]
        })
      )
    }]
  })

  const buffer = await Packer.toBlob(doc)
  saveAs(buffer, filename)
} 