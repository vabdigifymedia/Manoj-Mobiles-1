import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        
        // Extract order ID from Plural's POST payload
        const orderId = formData.get('order_id') || formData.get('merchant_order_reference') || formData.get('orderId') || '';
        
        const baseUrl = new URL(req.url).origin;
        // Perform a 303 See Other redirect to force the browser to do a GET request
        return NextResponse.redirect(`${baseUrl}/payment/success?orderId=${orderId}`, 303);
    } catch (error) {
        console.error("Error parsing Plural callback", error);
        const baseUrl = new URL(req.url).origin;
        return NextResponse.redirect(`${baseUrl}/payment/success`, 303);
    }
}
