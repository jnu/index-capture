package  {
	import flash.display.MovieClip;
	import flash.display.SimpleButton;
	import fl.motion.Color;
	import flash.display.Shape;
	
	public class DLButton extends MovieClip {
		private var myButton : SimpleButton;
		
		public function DLButton()
		{
			init();
		}
		
		private function init():void
		{
			stage.frameRate = 31;
			makeButton();
			addChild(myButton);
		}
		
		private function makeButton():void
		{
			myButton = new SimpleButton();
			myButton.x = 70;
			myButton.y = 15;
			var width = 140;
			var height = 30;
			myButton.upState = makeSquare(0xFF9933, width, height);
			myButton.overState = makeSquare(0xFF6600, width, height);
			myButton.downState = makeSquare(0xCC6600, width, height);
			myButton.hitTestState = myButton.upState;
		}
		
		private function makeSquare(color:uint, width:Number, height:Number):Shape
		{
			var square:Shape = new Shape();
			square.graphics.beginFill(color, 1);
			square.graphics.drawRect(0, 0, width, height);
			square.graphics.endFill();
			return square;
		}

	}
	
}
