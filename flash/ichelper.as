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
		
		public function ICHelper()
		{
			Security.allowDomain("*");
			addCallbacks();
			// Show button: User interaction must call download.
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
		
		public function addCallbacks():void
		{
			if( ExternalInterface.available )
			{
				ExternalInterface.addCallback('createZip', create);
				ExternalInterface.addCallback('addFileToZip', addFile);
				ExternalInterface.addCallback('generateZip', finish);
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
			myButton.upState = makeButton(0xFF9933, w, h, lbl);
			myButton.overState = makeButton(0xFF6600, w, h, lbl);
			myButton.downState = makeButton(0xCC6600, w, h, lbl);
			myButton.hitTestState = myButton.upState;
		}
		
		private function makeButton(color:uint, w:Number, h:Number, lbl:String):Sprite
		{
			var square:Sprite = new Sprite();
			square.graphics.clear();
			square.graphics.beginFill(color, 1);
			square.graphics.drawRoundRect(0, 0, w, h, 10, 10);
			square.graphics.endFill();
			var txt:TextField = new TextField();
			txt.text = lbl;
			txt.x = 50;
			txt.y = 5;
			txt.selectable = false;
			square.addChild(txt);
			return square;
		}
	}
}