export declare function qaTicketDir(key: string, title?: string): { dir?: string; existed?: boolean; error?: string };
export declare function copyWorkbookToQa(ticket: { key: string; title?: string; files?: { workbook?: string } }): { file?: string; folderExisted?: boolean; error?: string };
