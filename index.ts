import { Mesh } from "./proxies";

const mesh = new Mesh();

mesh.add("www.dothq.co", "127.0.0.1", 3000);

mesh.start();