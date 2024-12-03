import { Snake } from '../entities/Snake';
import { Grid } from '../core/Grid';
import { Food } from '../entities/Food';
import { PowerUp } from '../entities/PowerUp';
import { GameConfig } from '../config/gameConfig';

export type Game = {
    snake: Snake;
    grid: Grid;
    food: Food;
    powerUp: PowerUp;
    config: GameConfig;
    recreate: () => boolean;
}
