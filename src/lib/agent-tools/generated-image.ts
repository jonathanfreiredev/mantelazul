/**
 * The image generated for the recipe during the current request.
 *
 * It is a mutable holder because the tool that produces the image and the tool that consumes it
 * are different calls: the agent asks for an image and then asks to save the recipe, and this
 * lets the second call find the URL without the model copying it from one tool result to the
 * next. A Cloudinary URL is long and high-entropy, so a hand-copied one is a broken image.
 *
 * It is created once per request and starts empty. An image generated in an earlier message is
 * offered separately, because by then the conversation may have moved on to another dish.
 */
export interface GeneratedImage {
  /** URL of the image generated during this request, or null while none has been. */
  url: string | null;
}
