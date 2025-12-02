// Temporary type shims until node_modules are installed
declare module 'react' {
  export interface ChangeEvent<T = HTMLInputElement> {
    target: T & { value: string };
  }
  
  export function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  
  export type FC<P = {}> = (props: P) => JSX.Element | null;
  export type ReactNode = any;
  
  export namespace React {
    interface ChangeEvent<T = HTMLInputElement> {
      target: T & { value: string };
    }
  }
  
  export default {
    useState,
    useEffect,
    useMemo,
    StrictMode: ({ children }: { children?: any }) => children,
    ChangeEvent: {} as any,
  };
}

// Global React namespace for React.ChangeEvent
declare namespace React {
  interface ChangeEvent<T = HTMLInputElement> {
    target: T & { value: string };
  }
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
  export function Fragment(props: { children?: any }): any;
}

declare module 'react-dom/client' {
  export function createRoot(container: HTMLElement): {
    render(element: any): void;
  };
}

declare module 'lucide-react' {
  interface IconProps {
    size?: number;
    className?: string;
  }
  export const Search: (props: IconProps) => any;
  export const ShoppingBag: (props: IconProps) => any;
  export const Menu: (props: IconProps) => any;
  export const X: (props: IconProps) => any;
  export const ChevronLeft: (props: IconProps) => any;
  export const MessageCircle: (props: IconProps) => any;
  export const Trash2: (props: IconProps) => any;
  export const Plus: (props: IconProps) => any;
  export const Minus: (props: IconProps) => any;
}

// JSX namespace declaration
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends React.ReactElement<any, any> {}
}
