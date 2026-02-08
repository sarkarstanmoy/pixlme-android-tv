package com.pixlme.tv

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import android.view.KeyEvent
import com.github.kevinejohn.keyevent.KeyEventModule

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "PixlmeTv"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  //react-native-screens override
  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(null);
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
      KeyEventModule.getInstance().onKeyDownEvent(keyCode, event)
      return super.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
      KeyEventModule.getInstance().onKeyUpEvent(keyCode, event)
      return super.onKeyUp(keyCode, event)
  }
}
