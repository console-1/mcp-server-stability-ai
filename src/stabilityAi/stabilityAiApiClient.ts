import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";

interface GenerateImageCoreOptions {
	aspectRatio?:
		| "16:9"
		| "1:1"
		| "21:9"
		| "2:3"
		| "3:2"
		| "4:5"
		| "5:4"
		| "9:16"
		| "9:21";
	negativePrompt?: string;
	seed?: number;
	stylePreset?:
		| "3d-model"
		| "analog-film"
		| "anime"
		| "cinematic"
		| "comic-book"
		| "digital-art"
		| "enhance"
		| "fantasy-art"
		| "isometric"
		| "line-art"
		| "low-poly"
		| "modeling-compound"
		| "neon-punk"
		| "origami"
		| "photographic"
		| "pixel-art"
		| "tile-texture";
	outputFormat?: "png" | "jpeg" | "webp";
	width?: number;
	height?: number;
	steps?: number;
	guidanceScale?: number;
}

interface OutpaintOptions {
	left?: number;
	right?: number;
	up?: number;
	down?: number;
	creativity?: number;
	prompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

interface SearchAndReplaceOptions {
	searchPrompt: string;
	prompt: string;
}

interface UpscaleCreativeOptions {
	prompt: string;
	negativePrompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
	creativity?: number;
}

interface ControlSketchOptions {
	prompt: string;
	controlStrength?: number;
	negativePrompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

interface SearchAndRecolorOptions {
	selectPrompt: string;
	prompt: string;
	growMask?: number;
	negativePrompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

interface ReplaceBackgroundAndRelightOptions {
	backgroundPrompt?: string;
	backgroundReference?: string;
	foregroundPrompt?: string;
	negativePrompt?: string;
	preserveOriginalSubject?: number;
	originalBackgroundDepth?: number;
	keepOriginalBackground?: boolean;
	lightSourceDirection?: "above" | "below" | "left" | "right";
	lightReference?: string;
	lightSourceStrength?: number;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

interface ControlStyleOptions {
	prompt: string;
	negativePrompt?: string;
	aspectRatio?:
		| "16:9"
		| "1:1"
		| "21:9"
		| "2:3"
		| "3:2"
		| "4:5"
		| "5:4"
		| "9:16"
		| "9:21";
	fidelity?: number;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

interface ControlStructureOptions {
	prompt: string;
	controlStrength?: number;
	negativePrompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

// New interfaces for Video and 3D generation options
interface GenerateVideoOptions {
	prompt: string;
	negativePrompt?: string;
	videoLength: number; // length in seconds
	fps: number;
	width?: number;
	height?: number;
	steps?: number;
	guidanceScale?: number;
	seed?: number;
	cameraPosition?: { x: number; y: number; z: number };
	cameraAngle?: { pitch: number; yaw: number; roll: number };
	outputFormat?: "mp4" | "webm";
}

interface Generate3DOptions {
	prompt: string;
	negativePrompt?: string;
	width?: number;
	height?: number;
	steps?: number;
	guidanceScale?: number;
	seed?: number;
	cameraView?: { 
		position: { x: number; y: number; z: number }; 
		target: { x: number; y: number; z: number };
	};
	outputFormat?: "obj" | "gltf" | "fbx";
}

function handleAxiosError(error: any): never {
	if (axios.isAxiosError(error) && error.response) {
		const data = error.response.data;
		if (error.response.status === 400) {
			throw new Error(`Invalid parameters: ${data.errors.join(", ")}`);
		}
		throw new Error(`API error (${error.response.status}): ${JSON.stringify(data)}`);
	}
	throw error;
}

export class StabilityAiApiClient {
	private readonly apiKey: string;
	private readonly baseUrl = "https://api.stability.ai";
	private readonly axiosClient: AxiosInstance;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
		this.axiosClient = axios.create({
			baseURL: this.baseUrl,
			timeout: 120000,
			maxBodyLength: Infinity,
			maxContentLength: Infinity,
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				Accept: "application/json",
			},
		});
	}

	// https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1core/post
	async generateImageCore(
		prompt: string,
		options?: GenerateImageCoreOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			prompt,
			output_format: "png",
			...options,
		};

		return this.axiosClient
			.postForm(
				`${this.baseUrl}/v2beta/stable-image/generate/core`,
				axios.toFormData(payload, new FormData())
			)
			.then((res) => {
				const base64Image = res.data.image;
				return {
					base64Image,
				};
			});
	}

	async removeBackground(
		imageFilePath: string
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: "png",
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/remove-background`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async outpaint(
		imageFilePath: string,
		options: OutpaintOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: options.outputFormat || "png",
			left: options.left || 0,
			right: options.right || 0,
			up: options.up || 0,
			down: options.down || 0,
			...(options.creativity !== undefined && {
				creativity: options.creativity,
			}),
			...(options.prompt && { prompt: options.prompt }),
			...(options.seed && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/outpaint`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async searchAndReplace(
		imageFilePath: string,
		options: SearchAndReplaceOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: "png",
			search_prompt: options.searchPrompt,
			prompt: options.prompt,
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/search-and-replace`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async upscaleFast(imageFilePath: string): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: "png",
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/upscale/fast`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error: any) {
			if (error.response?.status === 400 && error.response?.data?.errors) {
				const errorMessage = `Invalid parameters: ${error.response.data.errors.join(", ")}`;
				throw new Error(errorMessage);
			}
			throw new Error(
				`API error (${error.response?.status}): ${JSON.stringify(error.response?.data)}`
			);
		}
	}

	async fetchGenerationResult(id: string): Promise<{ base64Image: string }> {
		try {
			while (true) {
				const response = await this.axiosClient.get(
					`${this.baseUrl}/v2beta/results/${id}`,
					{
						headers: {
							Accept: "application/json",
						},
					}
				);

				if (response.status === 200) {
					return { base64Image: response.data.result };
				} else if (response.status === 202) {
					// Generation still in progress, wait 10 seconds before polling again
					await new Promise((resolve) => setTimeout(resolve, 10000));
				} else {
					throw new Error(`Unexpected status: ${response.status}`);
				}
			}
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async upscaleCreative(
		imageFilePath: string,
		options: UpscaleCreativeOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			prompt: options.prompt,
			output_format: options.outputFormat || "png",
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
			...(options.creativity !== undefined && {
				creativity: options.creativity,
			}),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/upscale/creative`,
				axios.toFormData(payload, new FormData())
			);

			// Get the generation ID from the response
			const generationId = response.data.id;

			// Poll for the result
			return await this.fetchGenerationResult(generationId);
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async controlSketch(
		imageFilePath: string,
		options: ControlSketchOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			prompt: options.prompt,
			output_format: options.outputFormat || "png",
			...(options.controlStrength !== undefined && {
				control_strength: options.controlStrength,
			}),
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/control/sketch`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async searchAndRecolor(
		imageFilePath: string,
		options: SearchAndRecolorOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			prompt: options.prompt,
			select_prompt: options.selectPrompt,
			output_format: options.outputFormat || "png",
			...(options.growMask !== undefined && { grow_mask: options.growMask }),
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/search-and-recolor`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async replaceBackgroundAndRelight(
		imageFilePath: string,
		options: ReplaceBackgroundAndRelightOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			subject_image: fs.createReadStream(imageFilePath),
			output_format: options.outputFormat || "png",
			...(options.backgroundPrompt && {
				background_prompt: options.backgroundPrompt,
			}),
			...(options.backgroundReference && {
				background_reference: fs.createReadStream(options.backgroundReference),
			}),
			...(options.foregroundPrompt && {
				foreground_prompt: options.foregroundPrompt,
			}),
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.preserveOriginalSubject !== undefined && {
				preserve_original_subject: options.preserveOriginalSubject,
			}),
			...(options.originalBackgroundDepth !== undefined && {
				original_background_depth: options.originalBackgroundDepth,
			}),
			...(options.keepOriginalBackground !== undefined && {
				keep_original_background: options.keepOriginalBackground,
			}),
			...(options.lightSourceDirection && {
				light_source_direction: options.lightSourceDirection,
			}),
			...(options.lightReference && {
				light_reference: fs.createReadStream(options.lightReference),
			}),
			...(options.lightSourceStrength !== undefined && {
				light_source_strength: options.lightSourceStrength,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/replace-background-and-relight`,
				axios.toFormData(payload, new FormData())
			);

			// Get the generation ID from the response
			const generationId = response.data.id;

			// Poll for the result
			return await this.fetchGenerationResult(generationId);
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async controlStyle(
		imageFilePath: string,
		options: ControlStyleOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			prompt: options.prompt,
			output_format: options.outputFormat || "png",
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.aspectRatio && {
				aspect_ratio: options.aspectRatio,
			}),
			...(options.fidelity !== undefined && {
				fidelity: options.fidelity,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/control/style`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	async controlStructure(
		imageFilePath: string,
		options: ControlStructureOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			prompt: options.prompt,
			output_format: options.outputFormat || "png",
			...(options.controlStrength !== undefined && {
				control_strength: options.controlStrength,
			}),
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/control/structure`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	// New method to generate video using Stability AI Video Generation API
	async generateVideo(
		options: GenerateVideoOptions
	): Promise<{ base64Video: string }> {
		const payload = {
			prompt: options.prompt,
			output_format: options.outputFormat || "mp4",
			video_length: options.videoLength,
			fps: options.fps,
			width: options.width,
			height: options.height,
			steps: options.steps,
			guidance_scale: options.guidanceScale,
			seed: options.seed,
			camera_position: options.cameraPosition,
			camera_angle: options.cameraAngle,
			negative_prompt: options.negativePrompt,
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-video/generate`,
				axios.toFormData(payload, new FormData())
			);
			// Assume the API returns a base64 encoded video in response.data.video
			return { base64Video: response.data.video };
		} catch (error) {
			handleAxiosError(error);
		}
	}

	// New method to generate 3D content using Stability AI 3D Generation API
	async generate3D(
		options: Generate3DOptions
	): Promise<{ base643DModel: string }> {
		const payload = {
			prompt: options.prompt,
			output_format: options.outputFormat || "obj",
			width: options.width,
			height: options.height,
			steps: options.steps,
			guidance_scale: options.guidanceScale,
			seed: options.seed,
			camera_view: options.cameraView,
			negative_prompt: options.negativePrompt,
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-3d/generate`,
				axios.toFormData(payload, new FormData())
			);
			// Assume the API returns a base64 encoded 3D model in response.data.model
			return { base643DModel: response.data.model };
		} catch (error) {
			handleAxiosError(error);
		}
	}
}
