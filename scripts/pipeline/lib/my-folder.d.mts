export declare const MY_DOCS: string;
export declare function myDocsAvailable(): boolean;
export declare function myTicketDir(key: string): string;
export declare function ensureMyTicketDir(key: string): string | null;
export declare function freeName(dir: string, base: string, ext: string): string;
export declare function copyToMyTicketDir(key: string, src: string, base?: string): string | null;
