
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PdfBase64Document = HydratedDocument<PdfBase64>;

@Schema()
export class PdfBase64 {
    @Prop()
    pdfBase64: string; 
}

export const PdfBase64Schema = SchemaFactory.createForClass(PdfBase64);



