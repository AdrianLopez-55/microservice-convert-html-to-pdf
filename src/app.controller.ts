import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConvertPdf } from './dto/convert.dto';
import * as puppeteer from 'puppeteer';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { PdfBase64, PdfBase64Document } from './schema/base64.schema';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import getConfig from './config/configuration';

@ApiTags('convert')
@Controller('/convert')
export class AppController {
  constructor(
    @InjectModel(PdfBase64.name) private pdfModel: Model<PdfBase64Document>,
    private readonly httpService: HttpService,
  ) {}

  @Get('/:id')
  async getPdf(@Param('id') id: string) {
    return await this.pdfModel.findById(id);
  }

  @Put('/:id')
  async updatePdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() requestBody: ConvertPdf,
  ) {
    const { textPlain } = requestBody;
    function getBolivianTime() {
      const now = new Date();
      const offset = -4;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const bolivianTime = new Date(utc + 3600000 * offset);

      const year = bolivianTime.getFullYear();
      const month = (bolivianTime.getMonth() + 1).toString().padStart(2, '0');
      const day = bolivianTime.getDate().toString().padStart(2, '0');
      console.log(year, month, day);
      const hours = bolivianTime.getHours();
      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
      const amOrPm = hours >= 12 ? 'PM' : 'AM';

      const minutes = bolivianTime.getMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      const seconds = bolivianTime.getSeconds();
      const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

      return `${year}/${month}/${day} - ${formattedHours}:${formattedMinutes}:${formattedSeconds} ${amOrPm}`;
    }
    const bolivianTime = getBolivianTime();
    if (!textPlain)
      throw new HttpException('error texto plano no definido ', 404);

    const browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:/Program Files/Google/Chrome/Application/Chrome.exe',
      // executablePath: '/usr/bin/chromium',
      // args: ['--no-sandbox'],
      defaultViewport: {
        width: 750,
        height: 500,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: false,
        isLandscape: true,
      },
    });

    const page = await browser.newPage();
    await page.setContent(textPlain, { waitUntil: 'networkidle0' });

    await page.emulateMediaType('screen');

    const base64Img1 = await this.imageToBase64(path.resolve('./Ing.Sis.png'));
    const base64Img2 = await this.imageToBase64(
      path.resolve('./logo_black.jpg'),
    );

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { left: '2.5cm', top: '2.5cm', right: '2.5cm', bottom: '2.5cm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="margin-left: 50px; display: flex; align-items: center; justify-content: center; font-family: Times, "Times New Roman", Georgia, serif, cursive; font-size: 0px; color: green;">
          <img src="data:image/jpg;base64,${base64Img2}" alt="Imagen Izquierda" style="margin-left: 10px; width: 40px; height: 40px;">
          <span style="display: flex; text-align: center; flex-direction: column;  align-items: center;font-size: 8px;">
            <h3 style="margin:0">UNIVERSIDAD AUTÓNOMA TOMÁS FRÍAS</h3>
            <h4 style="margin:0">CARRERA DE INGENIERÍA DE SISTEMAS</h4>
            <h4 style="margin:0">FUNDACIÓN DE SOFTWARE LIBRE</h4>
            <h5 style="margin:0">Potosí - Bolivia</h5>
          </span>  
        </div>        
      `,
      footerTemplate: `
        <div style="font-size: 10px; display: flex; align-items: center; justify-content: space-between; height: 20px; margin-top: 10px;">
    <span style="margin-left: 50px;">${bolivianTime}</span>
    </span>
    <span style="flex: 1; text-align: right; margin-left: 350px;">Page <span class="pageNumber">1</span> of <span class="totalPages">1</span></span>
   
  </div>
        `,
    });

    await browser.close();

    const base64Pdf = pdf.toString('base64');

    const fileObj = {
      mime: 'application/pdf',
      base64: base64Pdf,
    };

    const pdfUpdated = await this.pdfModel.findByIdAndUpdate(
      id,
      { pdfBase64: base64Pdf },
      { new: true },
    );
    // console.log(newPDF.pdfBase64)
    res.json({
      _id: pdfUpdated._id,
      // pdfBase64:pdfUpdated.pdfBase64
    });
  }

  @Delete('/:id')
  async deletePdf(@Param('id') id: string) {
    const pdf = await this.pdfModel.findByIdAndDelete(id);
    if (!pdf) {
      throw new HttpException('reporte no encontrado ', 404);
    }

    return pdf;
  }

  @Post()
  async createText(@Res() res: Response, @Body() requestBody: ConvertPdf) {
    const { textPlain } = requestBody;

    function getBolivianTime() {
      const now = new Date();
      const offset = -4;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const bolivianTime = new Date(utc + 3600000 * offset);

      const year = bolivianTime.getFullYear();
      const month = (bolivianTime.getMonth() + 1).toString().padStart(2, '0');
      const day = bolivianTime.getDate().toString().padStart(2, '0');
      console.log(year, month, day);
      const hours = bolivianTime.getHours();
      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
      const amOrPm = hours >= 12 ? 'PM' : 'AM';

      const minutes = bolivianTime.getMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      const seconds = bolivianTime.getSeconds();
      const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

      return `${year}/${month}/${day} - ${formattedHours}:${formattedMinutes}:${formattedSeconds} ${amOrPm}`;
    }
    const bolivianTime = getBolivianTime();
    if (!textPlain)
      throw new HttpException('error texto plano no definido ', 404);

    const browser = await puppeteer.launch({
      headless: true,

      executablePath: 'C:/Program Files/Google/Chrome/Application/Chrome.exe',

      // executablePath: '/usr/bin/chromium',
      // args: ['--no-sandbox'],
      defaultViewport: {
        width: 750,
        height: 500,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: false,
        isLandscape: true,
      },
    });

    const page = await browser.newPage();
    await page.setContent(textPlain, { waitUntil: 'networkidle0' });

    await page.emulateMediaType('screen');
    const base64Img2 = await this.imageToBase64(
      path.resolve('./logo_black.jpg'),
    );

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { left: '2cm', top: '2cm', right: '2cm', bottom: '2cm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="margin-left: 50px; display: flex; align-items: center; justify-content: center; font-family: Times, "Times New Roman", Georgia, serif, cursive; font-size: 0px; color: green;">
          <img src="data:image/jpg;base64,${base64Img2}" alt="Imagen Izquierda" style="margin-left: 10px; width: 40px; height: 40px;">
          <span style="display: flex; text-align: center; flex-direction: column;  align-items: center;font-size: 8px;">
          <h3 style="margin:0">UNIVERSIDAD AUTÓNOMA TOMÁS FRÍAS</h3>
          <h4 style="margin:0">CARRERA DE INGENIERÍA DE SISTEMAS</h4>
          <h4 style="margin:0">FUNDACIÓN DE SOFTWARE LIBRE</h4>
          <h5 style="margin:0">Potosí - Bolivia</h5></span>
          
        </div>        
      `,
      footerTemplate: `
        <div style="font-size: 10px; display: flex; align-items: center; justify-content: space-between; height: 20px; margin-top: 10px;">
    <span style="margin-left: 50px;">${bolivianTime}</span>
    </span>
    <span style="flex: 1; text-align: right; margin-left: 350px;">Page <span class="pageNumber">1</span> of <span class="totalPages">1</span></span>
   
  </div>
        `,
    });

    await browser.close();

    const base64Pdf = pdf.toString('base64');
    const mime = 'application/pdf';
    const fileObj = {
      mime: mime,
      base64: base64Pdf,
    };
    // const response = await this.httpService
    //   .post(`${process.env.API_FILES}/files/upload`, { file: fileObj })
    //   .toPromise();
    // console.log(response.data.file._id);
    const responseData = await this.uploadFile(fileObj);
    res.json({
      idFile: responseData.data.file._id,
    });
  }
  async imageToBase64(filePath) {
    const image = fs.readFileSync(filePath);
    return image.toString('base64');
  }

  private async uploadFile(fileObj: {
    mime: string;
    base64: string;
  }): Promise<any> {
    require('dotenv').config();
    return await this.httpService
      .post(`${getConfig().api_files_uploader}/files/upload`, { file: fileObj })
      .toPromise();
  }

  @Post('preview')
  async previewText(@Res() res: Response, @Body() requestBody: ConvertPdf) {
    const { textPlain } = requestBody;

    function getBolivianTime() {
      const now = new Date();
      const offset = -4;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const bolivianTime = new Date(utc + 3600000 * offset);

      const year = bolivianTime.getFullYear();
      const month = (bolivianTime.getMonth() + 1).toString().padStart(2, '0');
      const day = bolivianTime.getDate().toString().padStart(2, '0');
      console.log(year, month, day);
      const hours = bolivianTime.getHours();
      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
      const amOrPm = hours >= 12 ? 'PM' : 'AM';

      const minutes = bolivianTime.getMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      const seconds = bolivianTime.getSeconds();
      const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

      return `${year}/${month}/${day} - ${formattedHours}:${formattedMinutes}:${formattedSeconds} ${amOrPm}`;
    }
    const bolivianTime = getBolivianTime();
    if (!textPlain)
      throw new HttpException('error texto plano no definido ', 404);

    const browser = await puppeteer.launch({
      headless: true,

      executablePath: 'C:/Program Files/Google/Chrome/Application/Chrome.exe',

      // executablePath: '/usr/bin/chromium',
      // args: ['--no-sandbox'],
      defaultViewport: {
        width: 750,
        height: 500,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: false,
        isLandscape: true,
      },
    });

    const page = await browser.newPage();
    await page.setContent(textPlain, { waitUntil: 'networkidle0' });

    await page.emulateMediaType('screen');
    const base64Img2 = await this.imageToBase64(
      path.resolve('./logo_black.jpg'),
    );

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { left: '2cm', top: '2cm', right: '2cm', bottom: '2cm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="margin-left: 50px; display: flex; align-items: center; justify-content: center; font-family: Times, "Times New Roman", Georgia, serif, cursive; font-size: 0px; color: green;">
          <img src="data:image/jpg;base64,${base64Img2}" alt="Imagen Izquierda" style="margin-left: 10px; width: 40px; height: 40px;">
          <span style="display: flex; text-align: center; flex-direction: column;  align-items: center;font-size: 8px;">
          <h3 style="margin:0">UNIVERSIDAD AUTÓNOMA TOMÁS FRÍAS</h3>
          <h4 style="margin:0">CARRERA DE INGENIERÍA DE SISTEMAS</h4>
          <h4 style="margin:0">FUNDACIÓN DE SOFTWARE LIBRE</h4>
          <h5 style="margin:0">Potosí - Bolivia</h5></span>
          
        </div>        
      `,
      footerTemplate: `
        <div style="font-size: 10px; display: flex; align-items: center; justify-content: space-between; height: 20px; margin-top: 10px;">
        <span style="margin-left: 50px;">${bolivianTime}</span>
        </span>
        <span style="flex: 1; text-align: right; margin-left: 350px;">Page <span class="pageNumber">1</span> of <span class="totalPages">1</span></span>
        </div>
        `,
    });

    await browser.close();

    const base64Pdf = pdf.toString('base64');
    const mime = 'application/pdf';
    const fileObj = {
      mime: mime,
      base64: base64Pdf,
    };
    // const responseData = await this.uploadFile(fileObj);
    const responseData = fileObj.base64;
    res.json({
      base64File: responseData,
    });
  }
}
