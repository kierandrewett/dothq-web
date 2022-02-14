import { Server, Socket } from "net";
import { parseRequest } from "http-string-parser";
import { resolve } from "path";
import { parse } from "@ltd/j-toml";
import { readFileSync } from "fs";

const config: any = parse(
    readFileSync(resolve(process.cwd(), "config", "production.toml"))
);

class Mesh extends Server {
    public socket: Socket | undefined;

    public async onData(chunk: Buffer) {
        const { headers } = parseRequest(chunk.toString());

        const host = headers["Host"];
        const upstream = config.sites[host];
        const binding = config.upstream[upstream]

        if(!binding) return this.error("ECONNREFUSED", [host]);

        const remote = new Socket();

        remote.connect(parseInt(`${binding.port}`), binding.hostname, () => {
            remote.write(chunk);
        });
        
        remote.on("error", (e: any) => {
            remote.end();

            console.error(JSON.stringify(e))
            
            switch(e.code) {
                case "ECONNREFUSED":
                case "ENOTFOUND":
                    this.error("ECONNREFUSED", [host]);
                    break;
                default:
                    const err = "Mesh: Unknown Error";
                    this.html(`<title>${err}</title><body>${err}</body>`);
                    break;
            }
        });

        remote.on("data", (remoteChunk) => {
            this.socket?.write(remoteChunk);
        });
    }

    public onError(e: any) {
        console.error(JSON.stringify(e))
    }

    public error(errorCode: string, args?: string[]) {
        const path = resolve(__dirname, "pages", `${errorCode}.html`);
    
        let fileData = readFileSync(path, "utf-8");
        
        fileData = fileData.replace(/\$[0-9]+/, (match: any) => {
            const i = parseInt(match.replace("$", "")) - 1;
    
            return args && args.length ? args[i] : match;
        })
    
        this.html(fileData);
    }
    
    public html(markup: string) {
        const size = (new TextEncoder().encode(markup)).length;
    
        this.socket?.write(`HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: ${size}
Date: ${new Date().toUTCString()}
Connection: keep-alive
Keep-Alive: timeout=5
Server: Mesh
X-Powered-By: Mesh URL Service

${markup}`);
    }

    public constructor() {
        super();

        const port = parseInt(process.env.PORT as any) || 80;
        const address = process.env.ADDRESS || "127.0.0.1";

        this.listen(port, address, 0, () => {
            console.log(`Started Mesh URL Service at http://${address}:${port}`);
        });

        this.on("connection", (socket) => {
            this.socket = socket;

            socket.on("data", this.onData.bind(this));
            socket.on("error", this.onError.bind(this));
        });
    }
}

process.on("uncaughtException", (e) => {
    console.error(e);
})

new Mesh();