export class TemplateRenderer {
  static render(
    template: string,
    variables: Record<string, string | number | undefined>
  ): string {
    let rendered = template

    for (const [key, value] of Object.entries(variables)) {
      if (value === undefined || value === null) {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), '')
      } else {
        rendered = rendered.replace(
          new RegExp(`{{${key}}}`, 'g'),
          String(value)
        )
      }
    }

    return rendered
  }

  static renderWithHeroImage(
    template: string,
    variables: Record<string, string | number | undefined>,
    heroImageUrl?: string
  ): string {
    const rendered = this.render(template, variables)
    const trimmedUrl = heroImageUrl?.trim()

    if (!trimmedUrl) {
      return rendered
    }

    const safeUrl = trimmedUrl.replace(/"/g, '&quot;')
    const heroImageBlock = `
      <div style="margin: 0 0 20px 0; text-align: center;">
        <img src="${safeUrl}" alt="Hero" style="max-width: 100%; height: auto; border-radius: 12px;" />
      </div>
    `

    const bodyOpenTagMatch = rendered.match(/<body[^>]*>/i)
    if (!bodyOpenTagMatch || !bodyOpenTagMatch[0]) {
      return `${heroImageBlock}${rendered}`
    }

    return rendered.replace(bodyOpenTagMatch[0], `${bodyOpenTagMatch[0]}${heroImageBlock}`)
  }
}
