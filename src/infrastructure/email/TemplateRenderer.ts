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
}
