import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LangRedirect } from "@/components/LangRedirect";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vadzim-papkou.by"),
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  verification: {
    other: {
      "yandex-verification": "180fefae4563d69d",
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      data-color-mode="auto"
      data-light-theme="light"
      data-dark-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="preferred-lang";var s=localStorage.getItem(k);var p=location.pathname;var c=p==="/en"||p.indexOf("/en/")===0?"en":"ru";var pref=s;if(!pref){var langs=navigator.languages||[navigator.language];for(var i=0;i<langs.length;i++){var code=String(langs[i]).toLowerCase().split("-")[0];if(code==="ru"||code==="en"){pref=code;break;}}if(!pref)pref="ru";if(c==="en")return;}if(pref&&pref!==c)location.replace(pref==="en"?"/en/":"/");}catch(e){}})();`,
          }}
        />
        <link
          rel="preload"
          href="/fonts/MonaSansVF.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LangRedirect />
        {children}
      </body>
    </html>
  );
}
