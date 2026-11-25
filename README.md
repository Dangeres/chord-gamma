# Ладограф

Интерактивная гамма и трезвучия. Статический сайт находится в `dist/`, сборка и установка зависимостей не нужны.

## Публикация на GitHub Pages

1. В репозитории откройте **Settings → Pages**:
   https://github.com/Dangeres/chord-gamma/settings/pages
2. В разделе **Build and deployment → Source** выберите **GitHub Actions**.
3. Отправьте изменения с файлом `.github/workflows/pages.yml` в ветку `main`.
4. Дождитесь успешного завершения **Deploy to GitHub Pages** во вкладке **Actions**.

После публикации сайт будет доступен по адресу:
https://dangeres.github.io/chord-gamma/

Дальнейшие изменения в `main` публикуются автоматически. Публикацию также можно запустить вручную: **Actions → Deploy to GitHub Pages → Run workflow** (ветка `main`).

Workflow публикует только содержимое `dist/`. Пути к скриптам, стилям и другим локальным ресурсам должны оставаться относительными, чтобы сайт работал в подкаталоге `/chord-gamma/`.

Документация: [GitHub Pages с GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
