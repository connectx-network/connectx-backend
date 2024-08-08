import { Injectable, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FileType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class S3Service {
    private s3_client: S3Client;

    constructor(private readonly prisma: PrismaService) {
        this.s3_client = new S3Client({
            region: process.env.AWS_S3_REGION,
            credentials: {
                accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
            },
        });
    }

    async uploadFileToPublicBucket({ file, fileType }: {
        file: Express.Multer.File;
        fileType: FileType;
    }) {
        const bucket_name = process.env.AWS_S3_PUBLIC_BUCKET;
        const key = `${fileType}/${Date.now().toString()}-${file.originalname}`;
        await this.s3_client.send(
            new PutObjectCommand({
                Bucket: bucket_name,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
                ContentLength: file.size, // calculate length of buffer
            }),
        );

        const url = `https://${bucket_name}.s3.amazonaws.com/${key}`

        await this.prisma.imageBucket.create({
            data: {
                url,
                key,
                fileType
            }
        })

        return url;
    }

    async deleteImage(url: string){
        const image = await this.prisma.imageBucket.findUnique({
            where: {
                url
            }
        })

        if (!image) {
            throw new NotFoundException('Not found image!')
        }

        const {key} = image

        const bucket_name = process.env.AWS_S3_PUBLIC_BUCKET;

        const params = {
            Bucket: bucket_name,
            Key: key,
        };

        try {
            const command = new DeleteObjectCommand(params);
            await this.s3_client.send(command);
            await this.prisma.imageBucket.delete({
                where: {
                    id: image.id
                }
            })
            console.log('Image   deleted successfully');
            return  {success: true}
        } catch (err) {
            console.error('Error deleting image:', err);
            throw err;
        }
    }
}