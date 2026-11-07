/** docs/API.md §Poze (media): pozele încărcate din panou (S3 în producție). */
export interface MediaDto { url: string; key: string; contentType: string; size: number }
/** Un pas din copierea în S3 a pozelor legate de pe alte site-uri. */
export interface MediaImportDto { imported: number; failed: number; remaining: number }
