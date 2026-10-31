import { mount } from "pele";

const diagrams = Array.from(document.querySelectorAll<HTMLElement>("pre.mermaid"));

for (const node of diagrams) {
  const source = node.textContent ?? "";
  const mounted = mount(node, source, {
    onError(error) {
      console.error("Could not render diagram", error);
    },
  });
  if (mounted.error) {
    mounted.destroy();
    node.textContent = source;
    continue;
  }
  node.dataset.rendered = "true";
}
