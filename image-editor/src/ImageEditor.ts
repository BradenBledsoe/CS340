import * as fs from "fs";


class Color {
	public red: number;
	public green: number;
	public blue: number;
	
	constructor() {
		this.red = 0;
		this.green = 0;
		this.blue = 0;
	}
}

class Image {
    private pixels: Color[][];
	
    constructor(width: number, height: number) {
        //Initialize 2D array of Colors
        this.pixels = Array.from({ length: width }, () =>
            Array.from({ length: height }, () => new Color())
        );
	}
	
	public getWidth(): number {
		return this.pixels.length;
	}
	
	public getHeight(): number {
		return this.pixels[0]!.length;
	}
	
	public set(x: number, y: number, c: Color): void {
		this.pixels[x]![y] = c;
	}
	
	public get(x: number, y: number): Color {
		return this.pixels[x]![y]!;
	}
}

/**
 * ImageEditor
 */
class ImageEditor {
    run(args: string[] = process.argv.slice(2)): void { 
        try { 
            if (args.length < 3) {
				this.usage();
				return;
			}
			
			const inputFile = args[0];
			const outputFile = args[1];
			const filter = args[2];

			let image: Image = this.read(inputFile!);
			
			if (filter === "grayscale" || "greyscale") {
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
				
				let length: number = -1;
				length = parseInt(args[3]!, 10);
				
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
			
			this.write(image, outputFile!);			
		}
		catch (e) {
            console.error(e);
		}
    }

    private usage(): void {
		console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}\n");
    }

    private motionblur(image : Image, length: number): void {
		if (length < 1) {
			return;
		}	
		for (let x = 0; x < image.getWidth(); ++x) {
			for (let y = 0; y < image.getHeight(); ++y) {
				let curColor: Color = image.get(x, y);
				
				const maxX: number = Math.min(image.getWidth() - 1, x + length - 1);
				for (let i = x + 1; i <= maxX; ++i) {
					let tmpColor: Color = image.get(i, y);
					curColor.red += tmpColor.red;
					curColor.green += tmpColor.green;
					curColor.blue += tmpColor.blue;
				}

				const delta: number = (maxX - x + 1);
				curColor.red /= delta;
				curColor.green /= delta;
				curColor.blue /= delta;
			}
		}
	}
	
	private invert(image: Image) : void {
		for (let x = 0; x < image.getWidth(); ++x) {
			for (let y = 0; y < image.getHeight(); ++y) {
				let curColor: Color = image.get(x, y);
	
				curColor.red = 255 - curColor.red;
				curColor.green = 255 - curColor.green;
				curColor.blue = 255 - curColor.blue;
			}
		}
	}
	
	private grayscale(image: Image): void {
		for (let x = 0; x < image.getWidth(); ++x) {
			for (let y = 0; y < image.getHeight(); ++y) {
				let curColor: Color = image.get(x, y);
								
				let grayLevel: number = (curColor.red + curColor.green + curColor.blue) / 3;
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				curColor.red = grayLevel;
				curColor.green = grayLevel;
				curColor.blue = grayLevel;
			}
		}
	}
	
	private emboss(image: Image): void {
		for (let x = image.getWidth() - 1; x >= 0; --x) {
			for (let y = image.getHeight() - 1; y >= 0; --y) {
				let curColor: Color = image.get(x, y);
				
				let diff: number = 0;
				if (x > 0 && y > 0) {
                    let upLeftColor: Color = image.get(x - 1, y - 1);
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
				
				let grayLevel: number = (128 + diff);
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				curColor.red = grayLevel;
				curColor.green = grayLevel;
				curColor.blue = grayLevel;
			}
		}
	}
    
    private read(filePath: string): Image {
        const data = fs.readFileSync(filePath, "utf-8");
        const tokens = data
            .split(/\s+/)
            .filter(token => token.length > 0 && !token.startsWith("#"));
        
        let idx = 0;
            
        // Skip P3
        const magic = tokens[idx++];
        if (magic !== "P3") throw new Error("Invalid PPM File");
            
        // Parse width and height
        const width = parseInt(tokens[idx++]!, 10);
        const height = parseInt(tokens[idx++]!, 10);
                
        const image = new Image(width, height);

        // Skip max color value
        idx++;
        
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const color = new Color();
                color.red = parseInt(tokens[idx++]!, 10);
                color.green = parseInt(tokens[idx++]!, 10);
                color.blue = parseInt(tokens[idx++]!, 10);
                image.set(x, y, color);
            }
        }
        
        return image;		
    }

    private write(image: Image, filePath: string): void {
        const output: string[] = [];
        output.push("P3");
        output.push(image.getWidth() + " " + image.getHeight());
        output.push("255");
        
        for (let y = 0; y < image.getHeight(); ++y) {
            const row: string[] = [];
            for (let x = 0; x < image.getWidth(); ++x) {
                const color: Color = image.get(x, y);
                row.push(`${color.red} ${color.green} ${color.blue}`);
            }
            output.push(row.join(" "));
        }

        fs.writeFileSync(filePath, output.join("\n"));
	}
}