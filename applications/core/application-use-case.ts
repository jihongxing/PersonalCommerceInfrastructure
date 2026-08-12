import type { ActorContext } from './actor-context.js';

export interface ApplicationUseCase<Command, Result> {
  execute(command: Command, context: ActorContext): Promise<Result>;
}
