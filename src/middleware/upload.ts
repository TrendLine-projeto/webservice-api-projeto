import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

// Tipos de imagem permitidos
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido.'));
  }
};

// Armazenamento em memória (sem salvar no disco)
const storage = multer.memoryStorage();

// Configuração do upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});

export default upload;
