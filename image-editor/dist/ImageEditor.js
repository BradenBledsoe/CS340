"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
/**
 * ImageEditor
 */
class ImageEditor {
    run(args = process.argv.slice(2)) {
        try {
            if (args.length < 3) {
                this.usage();
                return;
            }
            const inputFile = args[0];
            const outputFile = args[1];
            const filter = args[2];
            let image = this.read(inputFile);
            if (filter === "grayscale" || filter === "greyscale") {
                if (args.length != 3) {
                    this.usage();
                    return;
                }
                this.grayscale(image);
            }
            else if (filter === "invert") {
                if (args.length != 3) {
                    this.usage();
                    return;
                }
                this.invert(image);
            }
            else if (filter === "emboss") {
                if (args.length != 3) {
                    this.usage();
                    return;
                }
                this.emboss(image);
            }
            else if (filter === "motionblur") {
                if (args.length != 4) {
                    this.usage();
                    return;
                }
                let length = -1;
                length = parseInt(args[3], 10);
                if (isNaN(length) || length < 0) {
                    console.error("Invalid motion blur length");
                    return;
                }
                if (length < 0) {
                    this.usage();
                    return;
                }
                this.motionblur(image, length);
            }
            else {
                this.usage();
            }
            this.write(image, outputFile);
        }
        catch (e) {
            console.error(e);
        }
    }
    usage() {
        console.log("USAGE: node ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}\n");
    }
    motionblur(image, length) {
        if (length < 1) {
            return;
        }
        for (let x = 0; x < image.getWidth(); ++x) {
            for (let y = 0; y < image.getHeight(); ++y) {
                let curColor = image.get(x, y);
                const maxX = Math.min(image.getWidth() - 1, x + length - 1);
                for (let i = x + 1; i <= maxX; ++i) {
                    let tmpColor = image.get(i, y);
                    curColor.red += tmpColor.red;
                    curColor.green += tmpColor.green;
                    curColor.blue += tmpColor.blue;
                }
                const delta = (maxX - x + 1);
                curColor.red = Math.floor(curColor.red / delta);
                curColor.green = Math.floor(curColor.green / delta);
                curColor.blue = Math.floor(curColor.blue / delta);
            }
        }
    }
    invert(image) {
        for (let x = 0; x < image.getWidth(); ++x) {
            for (let y = 0; y < image.getHeight(); ++y) {
                let curColor = image.get(x, y);
                curColor.red = 255 - curColor.red;
                curColor.green = 255 - curColor.green;
                curColor.blue = 255 - curColor.blue;
            }
        }
    }
    grayscale(image) {
        for (let x = 0; x < image.getWidth(); ++x) {
            for (let y = 0; y < image.getHeight(); ++y) {
                let curColor = image.get(x, y);
                let grayLevel = Math.floor((curColor.red + curColor.green + curColor.blue) / 3);
                grayLevel = Math.max(0, Math.min(grayLevel, 255));
                curColor.red = grayLevel;
                curColor.green = grayLevel;
                curColor.blue = grayLevel;
            }
        }
    }
    emboss(image) {
        for (let x = image.getWidth() - 1; x >= 0; --x) {
            for (let y = image.getHeight() - 1; y >= 0; --y) {
                let curColor = image.get(x, y);
                let diff = 0;
                if (x > 0 && y > 0) {
                    let upLeftColor = image.get(x - 1, y - 1);
                    if (Math.abs(curColor.red - upLeftColor.red) > Math.abs(diff)) {
                        diff = curColor.red - upLeftColor.red;
                    }
                    if (Math.abs(curColor.green - upLeftColor.green) > Math.abs(diff)) {
                        diff = curColor.green - upLeftColor.green;
                    }
                    if (Math.abs(curColor.blue - upLeftColor.blue) > Math.abs(diff)) {
                        diff = curColor.blue - upLeftColor.blue;
                    }
                }
                let grayLevel = (128 + diff);
                grayLevel = Math.max(0, Math.min(grayLevel, 255));
                curColor.red = grayLevel;
                curColor.green = grayLevel;
                curColor.blue = grayLevel;
            }
        }
    }
    read(filePath) {
        const data = fs.readFileSync(filePath, "utf-8");
        const tokens = data
            .split(/\s+/)
            .filter((token) => token.length > 0 && !token.startsWith("#"));
        let idx = 0;
        // Skip P3
        const magic = tokens[idx++];
        if (magic !== "P3")
            throw new Error("Invalid PPM File");
        // Parse width and height
        const width = parseInt(tokens[idx++], 10);
        const height = parseInt(tokens[idx++], 10);
        const image = new Image(width, height);
        // Skip max color value
        idx++;
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const color = new Color();
                color.red = parseInt(tokens[idx++], 10);
                color.green = parseInt(tokens[idx++], 10);
                color.blue = parseInt(tokens[idx++], 10);
                image.set(x, y, color);
            }
        }
        return image;
    }
    write(image, filePath) {
        const output = [];
        output.push("P3");
        output.push(image.getWidth() + " " + image.getHeight());
        output.push("255");
        for (let y = 0; y < image.getHeight(); ++y) {
            const row = [];
            for (let x = 0; x < image.getWidth(); ++x) {
                const color = image.get(x, y);
                row.push(`${color.red} ${color.green} ${color.blue}`);
            }
            output.push(row.join(" "));
        }
        fs.writeFileSync(filePath, output.join("\n"));
    }
}
class Color {
    red;
    green;
    blue;
    constructor() {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
    }
}
class Image {
    pixels;
    constructor(width, height) {
        //Initialize 2D array of Colors
        this.pixels = Array.from({ length: width }, () => Array.from({ length: height }, () => new Color()));
    }
    getWidth() {
        return this.pixels.length;
    }
    getHeight() {
        return this.pixels[0].length;
    }
    set(x, y, c) {
        this.pixels[x][y] = c;
    }
    get(x, y) {
        return this.pixels[x][y];
    }
}
if (require.main === module) {
    const editor = new ImageEditor();
    editor.run();
}
//# sourceMappingURL=ImageEditor.js.map