import path from "path";

export type StoredImage = {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  alt: string;
};

export function filesToStoredImages(files: Express.Multer.File[] | undefined, title: string): StoredImage[] {
  return (files ?? []).map((file, index) => ({
    url: `/uploads/${path.basename(file.filename)}`,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    alt: `${title} image ${index + 1}`
  }));
}

export function fileToPublicUploadUrl(file: Express.Multer.File) {
  return `/uploads/${path.basename(file.filename)}`;
}

export function fileToStoredImage(file: Express.Multer.File, alt: string): StoredImage {
  return {
    url: `/uploads/${path.basename(file.filename)}`,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    alt
  };
}
