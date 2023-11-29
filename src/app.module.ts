import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PdfBase64, PdfBase64Schema } from './schema/base64.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://127.0.0.1',
      { dbName: 'pdfBase64' },
      //'mongodb://fundation:freefundation221@10.10.214.219:27020/',{
      //   dbName:'pdfBase64'
      // }
    ),
    MongooseModule.forFeature([
      { name: PdfBase64.name, schema: PdfBase64Schema },
    ]),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
