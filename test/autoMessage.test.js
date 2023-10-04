import { autoMessage } from '../src/functions/autoMessage.js?'
import { vi, describe, it, expect } from 'vitest'
import { BlobServiceClient } from '@azure/storage-blob'
import { getFileFromContainer, responseFromTWIML } from '../src/functions/autoMessage'
import { Readable } from 'node:stream'

// const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
// const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY
// const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME
// console.log("Test Using ", accountName, accountKey, containerName)

class AzureError extends Error {
    code
    constructor(code) {
        super()
        this.code = code
    }
}

// - Mock 3rd Party Azure Blob Functions
function getContainerClientMock(containerName) {
    return {
        getBlobClient: vi.fn().mockImplementation(() => {
            return {
                download: vi.fn().mockImplementation(() => {
                    return {
                        readableStreamBody: Readable.from("Hello World", {encoding: 'utf8'})
                    }
                })
            }
        })
    }
}

function getContainerClientMockThrowsBlobNotFound(containerName) {
    return {
        getBlobClient: vi.fn().mockImplementation(() => {
            return {
                download: vi.fn().mockImplementation(() => {
                    throw new AzureError("BlobNotFound")
                })
            }
        })
    }
    // return {
    //     getBlobClient: vi.fn().mockImplementation(() => {
    //         throw new AzureError("BlobNotFound")        
    //     })
    // }
}

function getContainerClientMockThrowsUnknown(containerName) {
    return {
        getBlobClient: vi.fn().mockImplementation(() => {
            throw new Error("Unknown Error")
        })
    }
}

vi.mock('@azure/storage-blob', async (originalImports) => {
    const imports = await originalImports()
    return {
        StorageSharedKeyCredential: vi.fn(),
        BlobServiceClient: vi.fn(),
        ContainerClient: vi.fn()
    }
})

describe("Utilities Test Suite", () => {
    it('Storage configuration checks are performed', async () => {
        await expect(() => getFileFromContainer("testAccount", "testKey"))
            .rejects
            .toThrowError("Storage not configured")
    })

    it('Request validation checks are performed', async () => {
        await expect(() => getFileFromContainer("testAccount", "testKey", "testContainer"))
            .rejects
            .toThrowError("Bad Request, required input missing")
    })

    it('Mock read file from blob works', async () => {
        BlobServiceClient.prototype.getContainerClient = vi.fn().mockImplementation(getContainerClientMock)

        const content2 = await getFileFromContainer("testAccount", "testKey", "testContainer", "testFile")
        expect(content2.toString()).toBe("Hello World")
    })

    it('Twilio TWIML generation works', () => {
        const content = "Hello"
        const result = responseFromTWIML(content)

        expect(result).toBeTruthy()
        expect(result.contentType).toBe("text/xml")
        expect(result.body.toString()).toBe(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${content}</Message></Response>`)
    })
})

describe("Function Unit Suite", () => {
    const request = {
        formData: () => {
            return {
                get: (id) => {
                    return "Demo"
                }
            }
        }
    }

    const context = { log: () => {}, error: () => {} }

    it('autoMessage responds with unsupported input when blob does not exist', async () => {
        BlobServiceClient.prototype.getContainerClient = vi.fn().mockImplementation(getContainerClientMockThrowsBlobNotFound)

        const result = await autoMessage(request, context)
        expect(result).toBeTruthy()
        expect(Object.keys(result).length).toBe(0)
    })

    it('autoMessage responds with Failed to respond to request for coverage', async () => {
        BlobServiceClient.prototype.getContainerClient = vi.fn().mockImplementation(getContainerClientMockThrowsUnknown)
        const result = await autoMessage(request, context)
        expect(result).toBeTruthy()
        expect(Object.keys(result).length).toBe(0)
    })

    it('Valid autoMessage response', async () => {
        BlobServiceClient.prototype.getContainerClient = vi.fn().mockImplementation(getContainerClientMock)
    
        const content = `Hello World`
        const result = await autoMessage(request, context)
        expect(result).toBeTruthy()
        expect(result.contentType).toBe("text/xml")
        expect(result.body.toString()).toBe(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${content}</Message></Response>`)
    })
})