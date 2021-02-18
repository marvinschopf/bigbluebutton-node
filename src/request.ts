import { createHash } from "crypto";

function sha1(string: string): string {
    return createHash("sha1").update(string).digest("hex");
}

function authenticateRequest(url: string, apiCallName: string, secret: string): string {
    const authenticatedUrl: string = `${apiCallName}${url}${secret}`;
    const hash: string = sha1(authenticatedUrl);
    return `${url}&checksum=${hash}`;
}

export function buildRequest(base: string, method: string, params: string, secret: string): string {
    return `${base}?${authenticateRequest(params, method, secret)}`;
};