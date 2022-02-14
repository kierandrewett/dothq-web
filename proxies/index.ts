import { parse } from "@ltd/j-toml";
import { writeFileSync } from "fs";
import { resolve } from "path";

interface Config {
    hostname?: string,
    port: number,
    headers: Record<string, string>,
    sites: Site[]
}

interface Site {
    id: string
}

export class Mesh {
    private torConfig = `
        SocksPort 0
    `

    public add(name: string, hostname: string, port: number) {
        this.torConfig += `
            HiddenServiceDir /var/lib/tor/hidden_service/${name}
            HiddenServiceVersion 2
            HiddenServicePort 80 ${hostname}:${port}
        `.trim();
    }

    public start() {
        writeFileSync(resolve(process.cwd(), "torrc"), this.torConfig);
    }
}