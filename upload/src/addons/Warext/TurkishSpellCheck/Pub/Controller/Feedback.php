<?php

namespace Warext\TurkishSpellCheck\Pub\Controller;

use XF\Pub\Controller\AbstractController;

class Feedback extends AbstractController
{
    protected function limitText($value, int $limit): string
    {
        $value = str_replace("\0", '', (string)$value);
        if ($value === '' || $limit < 1)
        {
            return '';
        }
        if (!preg_match_all('/./us', $value, $matches))
        {
            return '';
        }
        return implode('', array_slice($matches[0], 0, $limit));
    }

    public function actionIndex()
    {
        $this->assertPostOnly();

        $visitor = \XF::visitor();
        if (!$visitor->user_id || !\XF::options()->warextSpellFeedback)
        {
            return $this->noPermission();
        }

        $raw = $this->filter('payload', 'str');
        $payload = json_decode($raw, true);
        if (!is_array($payload))
        {
            return $this->error('Geçersiz geri bildirim.');
        }

        $type = $this->limitText($payload['type'] ?? '', 32);
        if (!in_array($type, ['false_positive', 'accepted'], true))
        {
            return $this->error('Geçersiz geri bildirim türü.');
        }

        $rule = $this->limitText($payload['rule'] ?? '', 96);
        $word = $this->limitText($payload['word'] ?? $payload['from'] ?? '', 96);
        $target = $this->limitText($payload['to'] ?? '', 128);
        $text = $this->limitText($payload['text'] ?? '', 320);
        $confidence = max(0, min(1000, (int)round(((float)($payload['confidence'] ?? 0)) * 1000)));
        $now = \XF::$time;

        $last = (int)\XF::db()->fetchOne(
            'SELECT MAX(report_date) FROM xf_warext_spell_feedback WHERE user_id = ?',
            $visitor->user_id
        );
        if ($last && $last > $now - 2)
        {
            return $this->message('OK');
        }

        \XF::db()->insert('xf_warext_spell_feedback', [
            'user_id' => $visitor->user_id,
            'feedback_type' => $type,
            'rule_key' => $rule,
            'word' => $word,
            'target' => $target,
            'source_text' => $text,
            'confidence' => $confidence,
            'report_date' => $now
        ]);

        return $this->message('OK');
    }
}
