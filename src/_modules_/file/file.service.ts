import { BadRequestException, Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import {BaseFileUploadDto, DeleteFileDto} from './file.dto';
import {S3Service} from "../s3/s3.service";

@Injectable()
export class FileService {
  constructor(
      // private readonly firebaseService: FirebaseService,
  private readonly s3Service: S3Service,
  ) {}

  // async uploadFile(
  //   file: Express.Multer.File,
  //   fileUploadDto: BaseFileUploadDto,
  // ): Promise<string> {
  //   const storage = this.firebaseService.getFirebaseApp().storage();
  //   const bucket = storage.bucket();
  //   const { fileType } = fileUploadDto;
  //   try {
  //     const blob = await bucket.file(`${fileType}/${file.originalname}`);
  //
  //     const blobWriter = await blob.createWriteStream({
  //       metadata: {
  //         contentType: file.mimetype,
  //       },
  //       public: true,
  //     });
  //
  //     await blobWriter.end(file.buffer);
  //
  //     return blob.publicUrl();
  //   } catch (error) {
  //     console.log(error);
  //     throw new BadRequestException('Failed to upload the file');
  //   }
  // }
  //
  // async uploadMultipleFile(
  //   files: Array<Express.Multer.File>,
  //   fileUploadDto: BaseFileUploadDto,
  // ): Promise<Array<string>> {
  //   const storage = this.firebaseService.getFirebaseApp().storage();
  //   const bucket = storage.bucket();
  //   const { fileType } = fileUploadDto;
  //
  //   return Promise.all(
  //     files.map(async (file: Express.Multer.File) => {
  //       try {
  //         const blob = await bucket.file(`${fileType}/${file.originalname}`);
  //
  //         const blobWriter = await blob.createWriteStream({
  //           metadata: {
  //             contentType: file.mimetype,
  //           },
  //           public: true,
  //         });
  //
  //         await blobWriter.end(file.buffer);
  //
  //         return blob.publicUrl();
  //       } catch (error) {
  //         console.log(error);
  //         throw new BadRequestException('Failed to upload the file');
  //       }
  //     }),
  //   );
  // }

  async uploadFile(
      file: Express.Multer.File,
      fileUploadDto: BaseFileUploadDto,
  ): Promise<string> {
    const { fileType } = fileUploadDto;
    try {
      return this.s3Service.uploadFileToPublicBucket({ file, fileType });
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to upload the file');
    }
  }

  async delete(deleteFileDto: DeleteFileDto) {
    const {url} = deleteFileDto
    return this.s3Service.deleteImage(url);
  }
}
