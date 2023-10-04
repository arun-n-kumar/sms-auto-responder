import { app } from "@azure/functions"
import { autoMessage } from "./functions/autoMessage.js?"

/**
 * Azure Function Binding
 */
app.http('autoMessage', {
    methods: ['GET', 'POST'],
    handler: autoMessage
})