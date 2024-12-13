import { ContentType, ContentTone } from '../types/content'

interface Template {
  title: string
  description: string
  structure: string
  type: ContentType
  recommendedTone: ContentTone
}

export const templates: Record<string, Template> = {
  'blog-howto': {
    title: 'How-to Guide',
    description: 'Step-by-step tutorial format',
    structure: `# [Title]

## Introduction
[Brief overview of what readers will learn]

## Prerequisites
- [Required knowledge/tools]
- [Setup requirements]

## Step 1: [First Step]
[Detailed explanation]

## Step 2: [Second Step]
[Detailed explanation]

## Common Challenges
[Address potential issues]

## Conclusion
[Summarize key takeaways]`,
    type: 'blog',
    recommendedTone: 'formal'
  },
  'blog-listicle': {
    title: 'List Article',
    description: 'Numbered list of items or tips',
    structure: `# [Number] [Topic]

## Introduction
[Why this list matters]

1. [First Item]
   [Explanation]

2. [Second Item]
   [Explanation]

## Summary
[Key takeaways]`,
    type: 'blog',
    recommendedTone: 'casual'
  },
  'social-product': {
    title: 'Product Launch',
    description: 'Social media announcement for new products',
    structure: `🎉 Introducing [Product Name]!

✨ [Key Feature 1]
💪 [Key Feature 2]
🎯 [Key Feature 3]

Available now at [Link]
#ProductLaunch #Innovation`,
    type: 'social',
    recommendedTone: 'persuasive'
  }
} 