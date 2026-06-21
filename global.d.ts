// Ambient module declarations for CSS Modules consumed by the library source.
// localsConvention is camelCaseOnly, so generated keys are camelCase strings.
declare module '*.module.css' {
    const classes: Readonly<Record<string, string>>;
    export default classes;
}

// Plain CSS imported for its side effects (token, reset, and layout bundles).
declare module '*.css';
