<?php

namespace Warext\TurkishSpellCheck\Admin\Controller;

use XF\Admin\Controller\AbstractController;

class Learning extends AbstractController
{
    public function actionIndex()
    {
        $this->assertAdminPermission('warextSpellLearning');

        $candidates = \XF::db()->fetchAll(
            "SELECT word, COUNT(*) AS report_count, COUNT(DISTINCT user_id) AS user_count, MAX(report_date) AS last_date
             FROM xf_warext_spell_feedback
             WHERE feedback_type = 'false_positive' AND word <> ''
             GROUP BY word
             ORDER BY report_count DESC, user_count DESC, last_date DESC
             LIMIT 250"
        );

        $rules = \XF::db()->fetchAll(
            "SELECT rule_key, COUNT(*) AS report_count, COUNT(DISTINCT user_id) AS user_count, MAX(report_date) AS last_date
             FROM xf_warext_spell_feedback
             WHERE feedback_type = 'false_positive' AND rule_key <> ''
             GROUP BY rule_key
             ORDER BY report_count DESC, user_count DESC, last_date DESC
             LIMIT 150"
        );

        $accepted = \XF::db()->fetchAll(
            "SELECT word, target, rule_key, COUNT(*) AS accept_count, COUNT(DISTINCT user_id) AS user_count, MAX(report_date) AS last_date
             FROM xf_warext_spell_feedback
             WHERE feedback_type = 'accepted' AND word <> '' AND target <> ''
             GROUP BY word, target, rule_key
             ORDER BY accept_count DESC, user_count DESC, last_date DESC
             LIMIT 150"
        );

        $approved = preg_split('/[\r\n,;]+/u', (string)\XF::options()->warextSpellCustomWords, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return $this->view('Warext\TurkishSpellCheck:Learning', 'warext_spell_learning', [
            'candidates' => $candidates,
            'rules' => $rules,
            'accepted' => $accepted,
            'approved' => array_values(array_unique(array_map('trim', $approved)))
        ]);
    }

    public function actionApprove()
    {
        $this->assertPostOnly();
        $this->assertAdminPermission('warextSpellLearning');

        $word = trim($this->filter('word', 'str'));
        if (!preg_match('/^[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû\'’-]{2,64}$/u', $word))
        {
            return $this->error('Geçersiz kelime.');
        }

        $option = \XF::em()->find('XF:Option', 'warextSpellCustomWords');
        if (!$option)
        {
            return $this->error('Forum özel sözlüğü bulunamadı.');
        }

        $current = preg_split('/[\r\n,;]+/u', (string)$option->option_value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $normalized = static function ($value)
        {
            return mb_strtolower(str_replace(['I', 'İ'], ['ı', 'i'], trim((string)$value)), 'UTF-8');
        };
        $key = $normalized($word);
        $map = [];
        foreach ($current as $item)
        {
            $item = trim($item);
            if ($item !== '')
            {
                $map[$normalized($item)] = $item;
            }
        }
        $map[$key] = $word;
        ksort($map, SORT_NATURAL | SORT_FLAG_CASE);
        $option->option_value = implode("\n", array_values($map));
        $option->save();

        return $this->redirect($this->buildLink('warext-spell-learning'));
    }

    public function actionClear()
    {
        $this->assertPostOnly();
        $this->assertAdminPermission('warextSpellLearning');
        \XF::db()->delete('xf_warext_spell_feedback');
        return $this->redirect($this->buildLink('warext-spell-learning'));
    }
}
