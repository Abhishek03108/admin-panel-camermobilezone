import { useEffect } from "react";

const SITE_NAME = "Camera Mobile Zone — Admin";

function setMetaTag(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Lightweight SEO/meta component — no external dependency needed.
 * The admin panel itself is not meant to be publicly indexed (hence the
 * `noindex` robots tag), but every page still gets a proper <title> and
 * description for browser tabs, bookmarks, and internal link previews.
 */
export default function Seo({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
    setMetaTag(
      "description",
      description || "Camera Mobile Zone admin panel — manage products, orders, payments, and content."
    );
    setMetaTag("robots", "noindex, nofollow");
  }, [title, description]);

  return null;
}
