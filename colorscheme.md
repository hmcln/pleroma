# Colour Scheme

Based on the [Tokyo Night](https://github.com/enkia/tokyo-night-vscode-theme) theme. Syntax highlighting uses `tokyo-night` (dark) and `light-plus` (light).

## Core Theme Colours

Defined in `quartz.config.ts` and injected as CSS custom properties (`--light`, `--secondary`, etc.) via `quartz/util/theme.ts`.

| Variable          | Light Mode                      | Dark Mode                       | Usage                     |
| ----------------- | ------------------------------- | ------------------------------- | ------------------------- |
| `--light`         | `#d0d5e3`                       | `#1f2335`                       | Page background           |
| `--lightgray`     | `#e1e2e7`                       | `#292e42`                       | Borders, light accents    |
| `--gray`          | `#a1a6c5`                       | `#414868`                       | Muted text, graph links   |
| `--darkgray`      | `#6172b0`                       | `#a9b1d6`                       | Body text                 |
| `--dark`          | `#3760bf`                       | `#c0caf5`                       | Headings, strong text     |
| `--secondary`     | `#2e7de9`                       | `#7aa2f7`                       | Links, active states      |
| `--tertiary`      | `#587539`                       | `#9ece6a`                       | Hover states, accents     |
| `--highlight`     | `rgba(46, 125, 233, 0.15)`      | `rgba(122, 162, 247, 0.2)`      | Search/selection highlight|
| `--textHighlight` | `#f52a6580`                     | `#f7768ecc`                     | Inline text highlight     |

## Custom Overrides

Defined in `quartz/styles/custom.scss`.

| Element                              | Colour    |
| ------------------------------------ | --------- |
| `h1`–`h6`, `.nav-header`, `.page-title` | `#faba4a` |

## Typography

All fonts use **Ioskeley Mono** (local, weights 300–700).

| Variable       | Font           |
| -------------- | -------------- |
| `--headerFont` | Ioskeley Mono  |
| `--bodyFont`   | Ioskeley Mono  |
| `--codeFont`   | Ioskeley Mono  |
