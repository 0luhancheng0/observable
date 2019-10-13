// FIT2102 2018 Assignment 1
// https://docs.google.com/document/d/1woMAgJVf1oL3M49Q8N3E1ykTuTu5_r28_MQPVS5QIVo/edit?usp=sharing

/**
 * Direction class will record a motion direcion for a object
 * x and y is the vector representation of the direction 
 */
class Direction {
  x: number
  y: number
  redian: number
  speed: number
  constructor(redian: number, speed: number) {
    this.x = Math.cos(redian) * speed
    this.y = Math.sin(redian) * speed
    this.redian = redian
    this.speed = speed
  }

  /**
   * The method that reflect the direction of the element by inverse one of x or y's value 
   * @param towards the string indicate which direction the element will be reflect to
   */
  reflect_dir(towards: string) {
    if (towards==='up_down') {
      this.y = (-1)*this.y
    }
    else if (towards==='left_right') {
      this.x = (-1)*this.x
    }
  }
}

/**
 * Move class wrap the element with its direction 
 * if the direction is not provided in the constructor then it will create a random direction
 */
class Move {
  element: Elem
  direction: Direction
  constructor(element: Elem, speed: number, direction: Direction|undefined) {
    this.element = element
    if (direction) {
      this.direction = direction
    } else {
      // angle here will generate a random angle within range [-π/3, π/3]U[2π/3, 4π/3] to prevent ball stay in middle of canvas too long time
      const angle = Math.random()>0.5 ? random_within(-Math.PI/3, Math.PI/3) : random_within(2*Math.PI/3, 4*Math.PI/3)
      this.direction = new Direction(angle, speed)
    }
  }

  /**
   * this is the function that move the element in both x and y direction in a single time unit
   */
  move() {
    const x = Number(this.element.attr('cx'))+this.direction.x
    const y = Number(this.element.attr('cy'))+this.direction.y

    this.element.attr('cx', x)
    this.element.attr('cy', y)
  }

  /**
   * the method that reflect the element in x or y direction
   * @param towards the direction the element will be reflected to
   */
  reflect(towards: string) {
    this.direction.reflect_dir(towards)
  }


}

/**
 * this class will record the current score of each side
 * if one of the player reach the win_score, a pop up window will be displayed
 * And a new round will restart after player confirm the result
 */
class Scoreboard {
  [key: string]: any
  player1: string
  player2: string
  win_score: number
  scoreboard_elem: HTMLElement
  /**
   * the constructor of the scoreboard class
   * @param player1 the string representation of the name of first player
   * @param player2 the string representation of the name of second player
   * @param win_score the first one get to this score will win the game
   */
  constructor(player1: string, player2: string, win_score: number) {
    this[player1] = 0
    this[player2] = 0
    this.player1 = player1
    this.player2 = player2
    this.win_score = win_score
    this.scoreboard_elem = <HTMLElement>document.getElementById("scoreboard")
    const scoreboard_update_freq = 1
    Observable.interval(scoreboard_update_freq).subscribe(_=>{
      this.scoreboard_elem.innerHTML = this.player1+' '+this[this.player1]+' : ' + this[this.player2]+' '+this.player2
    })
  }

  /**
   * the function that add one point to either
   * it will reset the score of both side to 0 if one of player reached the win_score
   * the winner's name will be indicated by a pop-up window
   * @param name the name of which player is scoring the point
   */
  score(name: string) {
    if (this[name]!==undefined) {
      this[name] ++
      if (this[name] == this.win_score) {
        this.reset()
        alert(name+" won!")
      }
    }
    else {
      console.error(name+" doesn't exist");
    }

  }

  /**
   * reset method reset the score of both side to 0
   */
  reset() {
    this[this.player1] = 0
    this[this.player2] = 0
    
  }

}
/**
 * This function will generate a random number from within the range [low, high]
 * This function is impure 
 * @param low the lower bound of the range that random number will be generated
 * @param high the upper bound of the range that random number will be generated
 */
function random_within(low: number, high: number): number{
  return Math.random()*(high-low)+low
}

/**
 * the game pong
 */
function pong() {

  const scoreboard = new Scoreboard('computer', 'player', 11)

  /**
   * This function will return a move instance has element and direction included 
   * along with some associated method
   * @param radius the radius of the ball created by this function
   * @param speed the speed of the ball created by this function
   * @param direction the direction which the ball is going to be fired to
   */
  function initialize_ball_move(radius: number, speed: number, direction: Direction|undefined) {
    return new Move(new Elem(canvas, 'circle')
      .attr('r', radius)
      .attr('cx', canvas_rect.width/2)
      .attr('fill', 'white')
      .attr('cy', random_within(canvas_rect.height-radius, radius)), speed, direction)
  }

  /**
   * This function will pop up a ball in in the middle of the screen with random direction 
   * and most logic of the game reside here, fresh_freq should be small to keep smooth animation
   * @param radius the radius of the ball
   * @param speed the speed of the ball
   * @param fresh_freq the frequency of refreshing, smaller value give better visual presentation
   */
  function pop_up_ball(radius: number, speed: number, fresh_freq: number) {
    
    // this code is here for testing the input argument, which also make the function impure
    if (radius >= paddle_height/2) {
      throw new Error('the perimeter of the ball should not be larger than the paddle')
    }
    
    // initialize the ball with random direction
    let ball_move = initialize_ball_move(radius, speed, undefined)

    // the speed of computer paddle, larger speed indicate faster paddle and higher difficulty
    const computer_speed = 1

    // the fresh frequency of computer paddle, low number represent better virtualization
    const computer_fresh_freq = 0.001
    Observable.interval(computer_fresh_freq)
      .subscribe((_:number)=>{
        const computer_y = parseInt(computer.attr('y'))

        // when ball is below computer paddle
        if (parseInt(ball_move.element.attr('cy')) > computer_y+paddle_height/2 && computer_y+paddle_height+computer_speed<=600) {
          computer.attr('y', computer_y+computer_speed)
        }

        // when ball is above computer paddle
        else if (parseInt(ball_move.element.attr('cy')) <= computer_y+paddle_height/2 && computer_y-computer_speed>=0){
          computer.attr('y', computer_y-computer_speed)
        }
        
      })

    // the observable that move the ball
    const interval_ob = Observable.interval(fresh_freq)
      .subscribe(_=>{

        // impure code, which update the state of the ball
        ball_move.move()
        const computer_rect = computer.elem.getBoundingClientRect()
        const player_rect = player.elem.getBoundingClientRect()
        const updated_ball = ball_move.element.elem.getBoundingClientRect()

        // check if the ball has touched the up-side or down-side border of canvas
        if (updated_ball.top <= canvas_rect.top || updated_ball.bottom >= canvas_rect.bottom) {
          ball_move.reflect('up_down')
        }
        // check right-side paddle caught the ball
        else if (updated_ball.right>=player_rect.left
          &&updated_ball.bottom<=player_rect.bottom
          &&updated_ball.top>=player_rect.top
          &&updated_ball.right<=player_rect.right) {
            ball_move.reflect('left_right')
        }
        // check if left-side paddle caught the ball
        else if (updated_ball.left<=computer_rect.right
          &&updated_ball.bottom<=computer_rect.bottom
          &&updated_ball.top>=computer_rect.top
          &&updated_ball.left>=computer_rect.left) {
            ball_move.reflect('left_right')
          }
        // if the ball exceed the right side of canvas, score point to computer
        else if (parseInt(ball_move.element.attr('cx'))>canvas_rect.right) {
          scoreboard.score('computer')
          ball_move.element.detach()
          ball_move = initialize_ball_move(radius, speed, undefined)
        }
        // if the ball exceed the left side of canvas, score point to player
        else if (parseInt(ball_move.element.attr('cx'))<canvas_rect.left) {
          scoreboard.score('player')
          ball_move.element.detach()
          ball_move = initialize_ball_move(radius, speed, undefined)
        }  
      })
    
    
  }


  const canvas = <HTMLElement>document.getElementById('canvas')
  const canvas_rect = canvas.getBoundingClientRect()

  // the line is impure since hte constructor of the Elem is impure
  const line = new Elem(canvas, 'line')
    .attr('x1', canvas_rect.width/2)
    .attr('y1', 0)
    .attr('x2', canvas_rect.width/2)
    .attr('y2', canvas_rect.height)
    .attr('style', 'stroke:white;stroke-width:2;stroke-dasharray:4')

  // setup the size of paddle
  const paddle_width = 3
  const paddle_height = 60

  // setup padding size between paddle and edge of canvas
  const padding = 20

  // create those two paddles
  const computer = new Elem(canvas, 'rect')
    .attr('x', padding)
    .attr('y', canvas_rect.height/2-paddle_height/2)
    .attr('width', paddle_width)
    .attr('height', paddle_height)
    .attr('style', 'fill:white;stroke:white')

  const player = new Elem(canvas, 'rect')
    .attr('x', canvas_rect.width-padding-paddle_width)
    .attr('y', canvas_rect.height/2-paddle_height/2)
    .attr('width', paddle_width)
    .attr('height', paddle_height)
    .attr('style', 'fill:white;stroke:white')

  // observe mousemove event and set the middle of player paddle always equal to the position of mouse
  Observable.fromEvent<MouseEvent>(canvas, 'mousemove')
    .map(({clientX, clientY})=>({
      mouse_x: clientX-canvas_rect.left,
      mouse_y: clientY-canvas_rect.top
    }))
    .filter(({mouse_y})=>mouse_y<=canvas_rect.height-paddle_height/2 && mouse_y>=paddle_height/2)
    .subscribe(({mouse_y})=>{
      // the action of set attribute is impure here, but it might be unavoidable
      player.attr('y', mouse_y-paddle_height/2)
    })


  // pass in radius, speed and fresh frequency of the ball
  const radius = 5 
  const speed = 1
  const frest_freq = 0.001
  pop_up_ball(radius, speed, frest_freq)

  
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in pong.html, animate them, and make them interactive.
  // Study and complete the tasks in basicexamples.ts first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
}



// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    pong();
  }


 

 