use anyhow::Context;
use reqwest::header::{HeaderMap, REFERER, USER_AGENT};
use serde_json::Value;

pub async  fn get_audio(id: &str) -> anyhow::Result<Vec<u8>> {
    let client = reqwest::Client::new();
    let api_url = format!(
        "https://api.bilibili.com/x/web-interface/view?bvid={}",
        id
    );
    let resp = client.get(&api_url).send().await?.json::<Value>().await?;
    let cid = resp["data"]["cid"].as_i64().context("无法获取CID")?;
    // let title = resp["data"]["title"].as_str().unwrap_or("audio");

    // fnval=16 dash
    let play_url = format!(
        "https://api.bilibili.com/x/player/playurl?bvid={}&cid={}&fnval=16",
        id, cid
    );
    let play_resp = client.get(&play_url).send().await?.json::<Value>().await?;

    // first audio track
    let audio_url = play_resp["data"]["dash"]["audio"][0]["base_url"]
        .as_str()
        .context("找不到音频流")?;

    let mut headers = HeaderMap::new();
    headers.insert(REFERER, "https://www.bilibili.com".parse()?);
    headers.insert(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0".parse()?);

    let response = client.get(audio_url).headers(headers).send().await?;

    Ok(response.bytes().await?.to_vec())
}