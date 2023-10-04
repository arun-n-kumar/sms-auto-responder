import { StorageSharedKeyCredential, BlobServiceClient } from "@azure/storage-blob"
import * as Twilio from 'twilio'
import { buffer } from 'node:stream/consumers'

// Service Inputs & Parameters
//-----------------------------
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

/**
 * Reads blob/file from Azure Blob Storage
 * @param {Storage Account Name}
 * @param {Storage Account Key}
 * @param {Container Name}
 * @param {Blob or File Name}
 * @returns Buffer
 */
export const getFileFromContainer = async (accountName, accountKey, containerName, fileName) => {
    if (!accountName || !accountKey || !containerName ) throw Error('Storage not configured')
    if (!containerName || !fileName ) throw Error('Bad Request, required input missing')

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
    const blobServiceClient   = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential)
    const blobContainerClient = blobServiceClient.getContainerClient(containerName)
    const blobClient          = blobContainerClient.getBlobClient(fileName)
    const downloadResponse    = await blobClient.download()
    const downloaded          = await buffer(downloadResponse.readableStreamBody)
    return downloaded
}

/**
 * Twilio helper function to use Twilio SDK and generate TwiML
 * @param {Text} SMS content 
 * @returns 
 */
export const responseFromTWIML = (content) => {
    const twiml = new Twilio.default.twiml.MessagingResponse()
    return {
        body: twiml.message(content),
        contentType: "text/xml"
    }
}

/**
 * SMS Auto Message Function
 * 
 * @param {HttpRequest} Azure  
 * @param {InitialContext} Azure  
 * @returns HttpResponse - an SMS
 */
export const autoMessage = async (request, context) => {
    context.log('SMS Auto Reply Request Received')
    const input = await request.formData()
    let response = {}

    try {
        // Step 1 - Load Inputs
        const body = input.get("Body")
        const fileName = body.toLowerCase() // Use the filename from the body.

        // Step 2 - Try n download file from Blob Storage
        const content = await getFileFromContainer(accountName, accountKey, containerName, fileName.toLowerCase())

        // Step 3 - Responsd using TwiML
        response = responseFromTWIML(content.toString())
    } catch (err) {
        if ( err && err.code === "BlobNotFound" ) {
            context.error("Unsupported Input Received! ", input)
        } else {
            context.error("Failed to respond to request ", err)
        }
    }
    return response
}