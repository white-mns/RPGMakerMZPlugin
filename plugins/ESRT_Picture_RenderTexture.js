//=============================================================================
// ESRT_Picture_RenderedTexture.js
// ----------------------------------------------------------------------------
// Copyright (c) 2024 @white_esorat
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// [HP]   : https://esora-t.jp/
// [Twitter]: https://twitter.com/white_esorat
// [Misskey.io]: https://misskey.io/@white_esorat
//=============================================================================

/*:
 * @target MZ
 * @base PluginCommonBase
 * @plugindesc レンダーテクスチャを使用し他のピクチャを転写する機能を追加するプラグイン（Ci-en実演用）
 * @author 白
 * 
 * @command RENDER_PICTURE
 * @text レンダーテクスチャ対応指定
 * @desc レンダーテクスチャを使用するピクチャの転写元と転写先を指定します
 * 
 * @arg srcPictureId
 * @text 転写元ピクチャーID
 * @desc 転写元ピクチャーID
 * @type number
 * 
 * @arg destPictureId
 * @text 転写先ピクチャーID
 * @desc 転写先ピクチャーID
 * @type number
 * 
 * @arg renderType
 * @text 転写タイプ
 * @desc 転写タイプ
 * @type select
 *
 * @option 一度だけ転写
 * @value 1
 *
 * @option 常時転写し続ける
 * @value 2
 * 
 * @help 
 *
 */

(() => {
    'use strict';
    const script = document.currentScript;

    //=============================================================================
    // PluginManagerEx
    // Game_Interpreter
    //  プラグインコマンドを追加定義します
    //=============================================================================
    PluginManagerEx.registerCommand(script, 'RENDER_PICTURE', function(args) {
        this.setRenderTexturePicture(args.srcPictureId, args.destPictureId, args.renderType);
    });

    Game_Interpreter.prototype.setRenderTexturePicture = function(srcPictureId, destPictureId, renderType) {
        $gameScreen.setRenderTexturePicture(srcPictureId, destPictureId, renderType);
    };

    //=============================================================================
    // Game_Screen
    //  レンダーテクスチャ使用スプライトの管理オブジェクトを追加します。
    //=============================================================================
    const _Game_Screen_initialize = Game_Screen.prototype.initialize;
    Game_Screen.prototype.initialize = function() {
        _Game_Screen_initialize.apply(this, arguments);

        this.renderTextureSet = {};
    };
    
    Game_Screen.prototype.setRenderTexturePicture = function(srcPictureId, destPictureId, renderType) {
        const realSrcPictureId = this.realPictureId(srcPictureId);
        const realDestPictureId = this.realPictureId(destPictureId);

        this.showRenderedPicture(destPictureId);
        this.renderTextureSet[[realSrcPictureId, realDestPictureId]] = renderType;
    };
    
    // 転写先ピクチャが表示されていなかった場合、座標10,10原寸でピクチャを表示します。
    //  （転写元のピクチャと少しずらして転写先ピクチャが表示されます）
    Game_Screen.prototype.showRenderedPicture = function(destPictureId) {
        if ($gameScreen.picture(destPictureId)) {return;}

        $gameScreen.showPicture(destPictureId, null, 0, 10, 10, 100, 100, 255, 0);
    };

    Game_Screen.prototype.deleteRenderTextureSet = function(key) {
        delete $gameScreen.renderTextureSet[key];
    };

    //=============================================================================
    // Spriteset_Base
    //  レンダーテクスチャ転写情報を元に、ピクチャを転写します。
    //=============================================================================
    const _Spriteset_Base_update = Spriteset_Base.prototype.update;
    Spriteset_Base.prototype.update = function() {
        _Spriteset_Base_update.apply(this, arguments);

        this.updateRenderTextures();
    };

    Spriteset_Base.prototype.updateRenderTextures = function() {
        if (!$gameScreen.renderTextureSet) {$gameScreen.renderTextureSet = {};}

        for (const key of Object.keys($gameScreen.renderTextureSet)) {
            // rendererは独自に作成せず、ツクールの画面を描画するために作られたものを拝借します。
            // 公式リファレンスより
            // https://pixijs.download/v5.3.12/docs/PIXI.RenderTexture.html (ツクールMZで使用するpixi.jsバージョン)
            //  > Hint-2: The actual memory allocation will happen on first render.
            //  > You shouldn't create renderTextures each frame just to delete them after, try to reuse them.
            // https://pixijs.download/v7.3.2/docs/PIXI.RenderTexture.html
            //  > Note that you should not create a new renderer, but reuse the same one as the rest of the application.
            const renderer = Graphics.app.renderer;
            renderer.render(this._pictureContainer.children[key.split(',')[0]-1], this._pictureContainer.children[key.split(',')[1]-1].renderedSprite.texture);

            if ($gameScreen.renderTextureSet[key] === 1) { $gameScreen.deleteRenderTextureSet(key);}
        }
    };
    
    //=============================================================================
    // Sprite_Picture
    //  レンダーテクスチャ用スプライトをピクチャスプライトの子要素に追加します。
    //=============================================================================
    const _Sprite_Picture_initialize = Sprite_Picture.prototype.initialize;
    Sprite_Picture.prototype.initialize = function(pictureId) {
        _Sprite_Picture_initialize.apply(this, arguments);
        
        this.renderedSprite = new Sprite();
        this.renderedSprite.texture = PIXI.RenderTexture.create({ width: 800, height: 600 });
        this.addChild(this.renderedSprite)
    };
})();
