# hexo-generator-i18n-archive

Hexo plugin for generating i18n archive pages with language-specific filtering and yearly, monthly, and daily organization.

## Features

- Generates archive pages for each language
- Filters posts by language
- Organizes posts by year, month, and day
- Supports pagination
- Can be toggled on/off via configuration

## Installation

Add to your `package.json`:

```json
{
  "dependencies": {
    "hexo-generator-i18n-archive": "file:../hexo-generator-i18n-archive"
  }
}
```

## Configuration

In `_config.yml`:

```yaml
# Enable/disable the plugin (default: true)
i18n_archive_generator:
  enable: true
  per_page: 10
  yearly: true
  monthly: true
  daily: false
```

To disable:

```yaml
i18n_archive_generator:
  enable: false
```

## Usage

The plugin automatically generates archive pages for all configured languages. No additional configuration needed beyond the standard Hexo language settings.

## I18n Structure

The plugin generates language-specific archive pages based on your Hexo language configuration:

- **Default language**: Archives at `/archives/` (root level)
- **Other languages**: Archives at `/{lang}/archives/`

Example with `language: ['en', 'zh-TW', 'zh-CN']`:
```
/archives/          # English (default language)
/zh-TW/archives/    # Traditional Chinese
/zh-CN/archives/    # Simplified Chinese
```

With yearly archives enabled:
```
/archives/2024/
/zh-TW/archives/2024/
/zh-CN/archives/2024/
```

With monthly archives enabled:
```
/archives/2024/01/
/zh-TW/archives/2024/01/
/zh-CN/archives/2024/01/
```

With daily archives enabled:
```
/archives/2024/01/15/
/zh-TW/archives/2024/01/15/
/zh-CN/archives/2024/01/15/
```
