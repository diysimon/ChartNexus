declare module '@cosui/cosmic-dynamic-ui' {
  import type san from 'san';
  interface App extends san.Component {
    appendData(data: Record<string, unknown>): void;
  }
  const UIJSON: {
    compile(options: {
      ui: unknown;
      components: Record<string, unknown>;
    }): new (options?: { data?: Record<string, unknown> }) => App;
  };
  export default UIJSON;
}
