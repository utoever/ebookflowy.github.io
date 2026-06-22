import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Ebookflowy",
  description: "Ebookflowy is a local-first cross-platform eBook/document reader for iOS",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Email', link: 'mailto:clipflowy@gmail.com' },
      { text: '개인정보처리지침', link: '/privacy-site/' }
    ],

    sidebar: [
      {
        text: '시작하기',
        items: [
          { text: 'ebookflowy 시작하기', link: '/01-welcome' },
          { text: '파일 추가와 권한', link: '/02-add-files' },
          { text: '홈과 책장 보기', link: '/03-home-library' },
          { text: '이어읽기와 독서중', link: '/04-reading-progress' }
        ]
      },
      {
        text: '읽기 도구',
        items: [
          { text: '리더 기본 사용', link: '/05-reader-basics' },
          { text: 'Markdown 읽기', link: '/06-markdown-reader' },
          { text: '검색 사용하기', link: '/07-search' },
          { text: '북마크와 하이라이트', link: '/08-bookmarks' },
          { text: '소리내어 읽기 (TTS)', link: '/13-tts' },
          { text: '리더 설정', link: '/14-reader-settings' }
        ]
      },
      {
        text: '보관함과 가져오기',
        items: [
          { text: '매직보관함', link: '/09-magic-library' },
          { text: '슬라이드 책장', link: '/10-slide-bookshelf' },
          { text: '공유로 가져오기', link: '/11-share-import' },
          { text: 'PDF 만들기', link: '/12-pdf-creator' },
          { text: 'AI 대화', link: '/12-ai-chat' },
          { text: '로컬 우선과 개인정보', link: '/15-privacy' }
        ]
      }
    ]

  }
})
