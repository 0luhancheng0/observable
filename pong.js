"use strict";
class Direction {
    constructor(redian, speed) {
        this.x = Math.cos(redian) * speed;
        this.y = Math.sin(redian) * speed;
        this.redian = redian;
        this.speed = speed;
    }
    reflect_dir(towards) {
        if (towards === 'up_down') {
            this.y = (-1) * this.y;
        }
        else if (towards === 'left_right') {
            this.x = (-1) * this.x;
        }
    }
}
class Move {
    constructor(element, speed, direction) {
        this.element = element;
        if (direction) {
            this.direction = direction;
        }
        else {
            const angle = Math.random() > 0.5 ? random_within(-Math.PI / 3, Math.PI / 3) : random_within(2 * Math.PI / 3, 4 * Math.PI / 3);
            this.direction = new Direction(angle, speed);
        }
    }
    move() {
        const x = Number(this.element.attr('cx')) + this.direction.x;
        const y = Number(this.element.attr('cy')) + this.direction.y;
        this.element.attr('cx', x);
        this.element.attr('cy', y);
    }
    reflect(towards) {
        this.direction.reflect_dir(towards);
    }
}
class Scoreboard {
    constructor(player1, player2, win_score) {
        this[player1] = 0;
        this[player2] = 0;
        this.player1 = player1;
        this.player2 = player2;
        this.win_score = win_score;
        this.scoreboard_elem = document.getElementById("scoreboard");
        const scoreboard_update_freq = 1;
        Observable.interval(scoreboard_update_freq).subscribe(_ => {
            this.scoreboard_elem.innerHTML = this.player1 + ' ' + this[this.player1] + ' : ' + this[this.player2] + ' ' + this.player2;
        });
    }
    score(name) {
        if (this[name] !== undefined) {
            this[name]++;
            if (this[name] == this.win_score) {
                this.reset();
                alert(name + " won!");
            }
        }
        else {
            console.error(name + " doesn't exist");
        }
    }
    reset() {
        this[this.player1] = 0;
        this[this.player2] = 0;
    }
}
function random_within(low, high) {
    return Math.random() * (high - low) + low;
}
function pong() {
    const scoreboard = new Scoreboard('computer', 'player', 11);
    function initialize_ball_move(radius, speed, direction) {
        return new Move(new Elem(canvas, 'circle')
            .attr('r', radius)
            .attr('cx', canvas_rect.width / 2)
            .attr('fill', 'white')
            .attr('cy', random_within(canvas_rect.height - radius, radius)), speed, direction);
    }
    function pop_up_ball(radius, speed, fresh_freq) {
        if (radius >= paddle_height / 2) {
            throw new Error('the perimeter of the ball should not be larger than the paddle');
        }
        let ball_move = initialize_ball_move(radius, speed, undefined);
        const computer_speed = 1;
        const computer_fresh_freq = 0.001;
        Observable.interval(computer_fresh_freq)
            .subscribe((_) => {
            const computer_y = parseInt(computer.attr('y'));
            if (parseInt(ball_move.element.attr('cy')) > computer_y + paddle_height / 2 && computer_y + paddle_height + computer_speed <= 600) {
                computer.attr('y', computer_y + computer_speed);
            }
            else if (parseInt(ball_move.element.attr('cy')) <= computer_y + paddle_height / 2 && computer_y - computer_speed >= 0) {
                computer.attr('y', computer_y - computer_speed);
            }
        });
        const interval_ob = Observable.interval(fresh_freq)
            .subscribe(_ => {
            ball_move.move();
            const computer_rect = computer.elem.getBoundingClientRect();
            const player_rect = player.elem.getBoundingClientRect();
            const updated_ball = ball_move.element.elem.getBoundingClientRect();
            if (updated_ball.top <= canvas_rect.top || updated_ball.bottom >= canvas_rect.bottom) {
                ball_move.reflect('up_down');
            }
            else if (updated_ball.right >= player_rect.left
                && updated_ball.bottom <= player_rect.bottom
                && updated_ball.top >= player_rect.top
                && updated_ball.right <= player_rect.right) {
                ball_move.reflect('left_right');
            }
            else if (updated_ball.left <= computer_rect.right
                && updated_ball.bottom <= computer_rect.bottom
                && updated_ball.top >= computer_rect.top
                && updated_ball.left >= computer_rect.left) {
                ball_move.reflect('left_right');
            }
            else if (parseInt(ball_move.element.attr('cx')) > canvas_rect.right) {
                scoreboard.score('computer');
                ball_move.element.detach();
                ball_move = initialize_ball_move(radius, speed, undefined);
            }
            else if (parseInt(ball_move.element.attr('cx')) < canvas_rect.left) {
                scoreboard.score('player');
                ball_move.element.detach();
                ball_move = initialize_ball_move(radius, speed, undefined);
            }
        });
    }
    const canvas = document.getElementById('canvas');
    const canvas_rect = canvas.getBoundingClientRect();
    const line = new Elem(canvas, 'line')
        .attr('x1', canvas_rect.width / 2)
        .attr('y1', 0)
        .attr('x2', canvas_rect.width / 2)
        .attr('y2', canvas_rect.height)
        .attr('style', 'stroke:white;stroke-width:2;stroke-dasharray:4');
    const paddle_width = 3;
    const paddle_height = 60;
    const padding = 20;
    const computer = new Elem(canvas, 'rect')
        .attr('x', padding)
        .attr('y', canvas_rect.height / 2 - paddle_height / 2)
        .attr('width', paddle_width)
        .attr('height', paddle_height)
        .attr('style', 'fill:white;stroke:white');
    const player = new Elem(canvas, 'rect')
        .attr('x', canvas_rect.width - padding - paddle_width)
        .attr('y', canvas_rect.height / 2 - paddle_height / 2)
        .attr('width', paddle_width)
        .attr('height', paddle_height)
        .attr('style', 'fill:white;stroke:white');
    Observable.fromEvent(canvas, 'mousemove')
        .map(({ clientX, clientY }) => ({
        mouse_x: clientX - canvas_rect.left,
        mouse_y: clientY - canvas_rect.top
    }))
        .filter(({ mouse_y }) => mouse_y <= canvas_rect.height - paddle_height / 2 && mouse_y >= paddle_height / 2)
        .subscribe(({ mouse_y }) => {
        player.attr('y', mouse_y - paddle_height / 2);
    });
    const radius = 5;
    const speed = 1;
    const frest_freq = 0.001;
    pop_up_ball(radius, speed, frest_freq);
}
if (typeof window != 'undefined')
    window.onload = () => {
        pong();
    };
//# sourceMappingURL=pong.js.map