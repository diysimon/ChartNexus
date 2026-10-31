declare module 'marklang' {
  interface Info {
    name: string;
    properties?: Record<string, unknown>;
    content?: string;
  }
  interface Instance {
    renderToElement(source: string, element: HTMLElement): void;
  }
  interface Marklang {
    (options?: {
      directives?: Record<string, (info: Info) => HTMLElement>;
      transformers?: {
        mdast?: Record<string, (params: { node: unknown }) => void>;
      };
    }): Instance;
    dataToSource(key: string, data: unknown): string;
  }
  const marklang: Marklang;
  export default marklang;
}
