package  {
	import flash.external.ExternalInterface;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.system.Security;
	import flash.display.SimpleButton;
	import flash.display.Shape;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.text.TextField;
	import nochump.util.zip.*;
	
	public class ICHelper extends MovieClip
	{
		private var zip:ZipOutput;
		private var prefix:String;
		private var init:Boolean = false;
		private var closed:Boolean = false;
		private var usedNames:Array = new Array();
		public var myButton:SimpleButton;
		public var myBG:Sprite;
		
		public function ICHelper()
		{
			Security.allowDomain("*");
			addCallbacks();
			// create BG
			myBG = new Sprite();
			myBG.graphics.beginFill(0xffffff);
			myBG.graphics.drawRect(0, 0, 140, 30);
			myBG.graphics.endFill();
			addChild(myBG);
			// Show button: FileReference must be called directly by user action.
			setupButton();
			addChild(myButton);
			myButton.addEventListener(MouseEvent.CLICK, onMouseClickEvent);
		}
		
		public function create(myPrefix:String="zip"):void
		{
			zip = new ZipOutput();
			prefix = myPrefix;
			init = true;
		}
		
		public function addFile(myName:String="", myData:String=""):Boolean
		{
			if( !init ) return false;
			try {
				myName = prefix + '-' + myName;
				var n:Number = 0;
				while( usedNames.indexOf(myName)+1 )
				{
					// Iterate until a unique name is found: increment
					// n and affix to find a unique name.
					if(n++) myName = myName.substr(0, myName.lastIndexOf('-'));
					myName += '-' + n;
				}
				usedNames.push(myName);
				var data:ByteArray = new ByteArray();
				data.writeUTF(myData);
				var ze:ZipEntry = new ZipEntry(myName);
				zip.putNextEntry(ze);
				zip.write(data);
				zip.closeEntry();
			} catch(e:Error) {
				// Not sure what errors occur, but some do.
				ExternalInterface.call('console.log', 'Error ('+e.errorID+'), '+e.name+': '+e.message)
				return false;
			}
			return true;
		}
		
		public function finish():Boolean
		{
			if(!init) return false;
			zip.finish();
			closed = true;
			return true;
		}
		
		protected function onMouseClickEvent(e:Event):void
		{
				if( !closed ) zip.finish();
				var bytes:ByteArray = zip.byteArray;
				var file:FileReference = new FileReference();
				file.save(bytes, prefix+".zip");
		}
		
		public function setBGColor(color:uint):void
		{
			myBG.graphics.beginFill(color);
			myBG.graphics.drawRect(0, 0, 140, 30);
			myBG.graphics.endFill();
		}
		
		public function addCallbacks():void
		{
			if( ExternalInterface.available )
			{
				ExternalInterface.addCallback('createZip', create);
				ExternalInterface.addCallback('addFileToZip', addFile);
				ExternalInterface.addCallback('generateZip', finish);
				ExternalInterface.addCallback('setBGColor', setBGColor);
			}
		}
		
		public function toJS(status:Object):Object
		{
			if( ExternalInterface.available )
			{
				ExternalInterface.call("fromAS", status);
				return status;
			}
			return null;
		}
		
		private function setupButton():void
		{
			myButton = new SimpleButton();
			myButton.x = 0;
			myButton.y = 0;
			var w = 140;
			var h = 30;
			var lbl = "Save Archive";
			myButton.upState = makeButton(0xff9933, 0xffffff, w, h, lbl);
			myButton.overState = makeButton(0xff6600, 0xffffff, w, h, lbl);
			myButton.downState = makeButton(0xcc6600, 0xffffff, w, h, lbl);
			myButton.hitTestState = myButton.upState;
		}
		
		private function makeButton(bgcolor:uint, color:uint, w:Number, h:Number, lbl:String):Sprite
		{
			var square:Sprite = new Sprite();
			square.graphics.clear();
			square.graphics.beginFill(bgcolor, 1);
			square.graphics.drawRoundRect(0, 0, w, h, 10, 10);
			square.graphics.endFill();
			var txt:TextField = new TextField();
			txt.textColor = color;
			txt.text = lbl;
			txt.x = 40;
			txt.y = 5;
			txt.selectable = false;
			square.addChild(txt);
			return square;
		}
	}
}